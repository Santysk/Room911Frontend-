// src/pages/AdminSessions.jsx
import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { DepartmentList } from '../types/models'
import { exportSessionsSummaryPDF } from '../utils/pdf'
import BackButton from '../components/BackButton' // ⬅️ NUEVO

const formatDur = (start, end) => {
  const ms = (end ?? Date.now()) - start
  const mins = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

const DEFAULT_LIMIT = 50

export default function AdminSessions() {
  const employees = useAppStore(s => s.employees)
  const allSessions = useAppStore(s => s.employeeSessions)

  // Filtros
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('ALL')
  const [status, setStatus] = useState('ALL') // ALL | OPEN | CLOSED
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [showAll, setShowAll] = useState(false)

  // Enriquecer con datos del empleado
  const sessions = useMemo(() => {
    const byId = new Map(employees.map(e => [e.id, e]))
    return allSessions.map(s => {
      const emp = byId.get(s.employeeId)
      return {
        ...s,
        internalId: emp?.internalId ?? s.internalId,
        department: emp?.department ?? '',
      }
    })
  }, [allSessions, employees])

  // Filtrado + orden (recientes primero)
  const filteredAll = useMemo(() => {
    const words = q.toLowerCase().trim()
    const fromTs = from ? new Date(from).getTime() : -Infinity
    const toTs = to ? new Date(to).getTime() + 24*60*60*1000 - 1 : Infinity
    return sessions.filter(s => {
      const okText = !words || `${s.internalId} ${s.employeeName}`.toLowerCase().includes(words)
      const okDept = dept === 'ALL' || s.department === dept
      const okStatus = status === 'ALL' || (status === 'OPEN' && !s.endedAt) || (status === 'CLOSED' && !!s.endedAt)
      const okDate = s.startedAt >= fromTs && s.startedAt <= toTs
      return okText && okDept && okStatus && okDate
    }).sort((a,b) => b.startedAt - a.startedAt)
  }, [sessions, q, dept, status, from, to])

  const filtered = useMemo(
    () => (showAll ? filteredAll : filteredAll.slice(0, limit)),
    [filteredAll, showAll, limit]
  )

  const onExportPDF = () => {
    exportSessionsSummaryPDF(filteredAll, {
      query: q,
      department: dept === 'ALL' ? 'Todos' : dept,
      status: status === 'ALL' ? 'Todos' : (status === 'OPEN' ? 'En curso' : 'Finalizada'),
      from, to
    })
  }

  const onExportCSV = () => {
    if (filteredAll.length === 0) { alert('No hay sesiones para exportar.'); return }
    const rows = [
      ['Internal ID','Nombre','Departamento','Inicio','Fin','Duración','Estado'],
      ...filteredAll.map(s => {
        const start = new Date(s.startedAt).toLocaleString()
        const end = s.endedAt ? new Date(s.endedAt).toLocaleString() : '—'
        const dur = formatDur(s.startedAt, s.endedAt)
        const est = s.endedAt ? 'Finalizada' : 'En curso'
        return [s.internalId, s.employeeName, s.department || '', start, end, dur, est]
      })
    ]
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'conexiones_filtrado.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const deptOptions = useMemo(() => {
    const set = new Set([...(DepartmentList || []), ...employees.map(e => e.department).filter(Boolean)])
    return ['ALL', ...Array.from(set)]
  }, [employees])

  return (
    <div className="container" style={{ display:'grid', gap:16 }}>
      {/* 🔙 Botón de volver al Dashboard */}
      <BackButton to="/" /> {/* ⬅️ NUEVO */}

      <h2>Historial de conexiones (Admin)</h2>

      <div className="card" style={{ display:'grid', gap:12 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input className="input" placeholder="Buscar por Internal ID o nombre..." value={q} onChange={e=>setQ(e.target.value)} />
          <select className="select" value={dept} onChange={e=>setDept(e.target.value)}>
            {deptOptions.map(d => <option key={d} value={d}>{d === 'ALL' ? 'Todos los deptos' : d}</option>)}
          </select>
          <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="ALL">Todos los estados</option>
            <option value="OPEN">En curso</option>
            <option value="CLOSED">Finalizada</option>
          </select>
          <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          <input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} />

          <span style={{ marginLeft:'auto', opacity:.7 }}>
            {filteredAll.length} resultado{filteredAll.length===1?'':'s'}
          </span>
          <button className="btn" onClick={onExportPDF} disabled={!filteredAll.length}>Exportar PDF</button>
          <button className="btn" onClick={onExportCSV} disabled={!filteredAll.length}>Exportar CSV</button>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ opacity:.75 }}>
            Mostrando {showAll ? filteredAll.length : Math.min(filteredAll.length, DEFAULT_LIMIT)} / {filteredAll.length}
          </span>
          {!showAll && filteredAll.length > DEFAULT_LIMIT && (
            <>
              <button className="btn" onClick={() => setLimit(l => l + DEFAULT_LIMIT)}>Ver +50</button>
              <button className="btn" onClick={() => setShowAll(true)}>Ver todas</button>
            </>
          )}
          {showAll && filteredAll.length > DEFAULT_LIMIT && (
            <button className="btn" onClick={() => { setShowAll(false); setLimit(DEFAULT_LIMIT) }}>
              Mostrar últimas {DEFAULT_LIMIT}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Internal ID</th>
              <th>Nombre</th>
              <th>Departamento</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Duración</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const start = new Date(s.startedAt).toLocaleString()
              const end = s.endedAt ? new Date(s.endedAt).toLocaleString() : '—'
              const dur = formatDur(s.startedAt, s.endedAt)
              return (
                <tr key={s.id}>
                  <td>{s.internalId}</td>
                  <td>{s.employeeName}</td>
                  <td>{s.department || ''}</td>
                  <td>{start}</td>
                  <td>{end}</td>
                  <td>{dur}</td>
                  <td>{s.endedAt ? 'Finalizada' : 'En curso'}</td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan="7" style={{ opacity:.7 }}>Sin resultados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
