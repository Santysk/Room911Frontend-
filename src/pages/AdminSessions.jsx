// src/pages/AdminSessions.jsx
import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { DepartmentList } from '../types/models'
import { exportSessionsSummaryPDF } from '../utils/pdf'
import BackButton from '../components/BackButton'

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
  const localSessionsCache = useAppStore(s => s.employeeSessions) // fallback local
  const sessionsByEmployeeId = useAppStore(s => s.sessionsByEmployeeId) // async (backend)

  // Filtros UI
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('ALL')
  const [status, setStatus] = useState('ALL') // ALL | OPEN | CLOSED
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [showAll, setShowAll] = useState(false)

  // Data cargada
  const [allSessions, setAllSessions] = useState([])   // sesiones enriquecidas
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Cargar desde backend: recorre empleados y concatena sus sesiones
  const loadAll = async () => {
    setLoading(true); setError('')
    try {
      const results = await Promise.allSettled(
        (employees || []).map(e => sessionsByEmployeeId(e.id))
      )
      // Flatten y enriquecer con datos del empleado
      const byId = new Map(employees.map(e => [e.id, e]))
      const merged = results.flatMap((res, idx) => {
        if (res.status !== 'fulfilled' || !Array.isArray(res.value)) return []
        const emp = employees[idx]
        return res.value.map(s => ({
          ...s,
          internalId: s.internalId || emp?.internalId || '',
          department: s.department || emp?.department || '',
        }))
      })
      // Ordenar por inicio desc
      merged.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))
      setAllSessions(merged)
    } catch (e) {
      console.error(e)
      setError('No se pudieron cargar todas las sesiones. Mostrando datos locales.')
      // Fallback: usar cache local y enriquecer
      const byId = new Map(employees.map(e => [e.id, e]))
      const merged = (localSessionsCache || []).map(s => {
        const emp = byId.get(s.employeeId)
        return {
          ...s,
          internalId: s.internalId || emp?.internalId || '',
          department: s.department || emp?.department || '',
        }
      }).sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))
      setAllSessions(merged)
    } finally {
      setLoading(false)
    }
  }

  // Cargar al montar o cuando cambian empleados
  useEffect(() => {
    if (!employees || employees.length === 0) {
      setAllSessions([]); return
    }
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees])

  // Filtrado + orden (ya viene ordenado, pero mantenemos por seguridad)
  const filteredAll = useMemo(() => {
    const words = q.toLowerCase().trim()
    const fromTs = from ? new Date(from).getTime() : -Infinity
    const toTs = to ? new Date(to).getTime() + 24*60*60*1000 - 1 : Infinity

    return allSessions.filter(s => {
      const okText = !words || `${s.internalId} ${s.employeeName}`.toLowerCase().includes(words)
      const okDept = dept === 'ALL' || s.department === dept
      const okStatus = status === 'ALL' || (status === 'OPEN' && !s.endedAt) || (status === 'CLOSED' && !!s.endedAt)
      const start = typeof s.startedAt === 'number' ? s.startedAt : new Date(s.startedAt).getTime()
      const okDate = start >= fromTs && start <= toTs
      return okText && okDept && okStatus && okDate
    }).sort((a,b) => {
      const A = typeof a.startedAt === 'number' ? a.startedAt : new Date(a.startedAt).getTime()
      const B = typeof b.startedAt === 'number' ? b.startedAt : new Date(b.startedAt).getTime()
      return B - A
    })
  }, [allSessions, q, dept, status, from, to])

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
        const startMs = typeof s.startedAt === 'number' ? s.startedAt : new Date(s.startedAt).getTime()
        const endMs = s.endedAt ? (typeof s.endedAt === 'number' ? s.endedAt : new Date(s.endedAt).getTime()) : null
        const start = new Date(startMs).toLocaleString()
        const end = endMs ? new Date(endMs).toLocaleString() : '—'
        const dur = formatDur(startMs, endMs)
        const est = endMs ? 'Finalizada' : 'En curso'
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
      {/* 🔙 Volver */}
      <BackButton to="/" />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <h2 style={{ margin:0 }}>Historial de conexiones (Admin)</h2>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={loadAll} disabled={loading}>
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="card"
          style={{ borderColor:'#b91c1c', background:'#fee2e2', color:'#7f1d1d' }}
        >
          {error}
        </div>
      )}

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
              const startMs = typeof s.startedAt === 'number' ? s.startedAt : new Date(s.startedAt).getTime()
              const endMs = s.endedAt ? (typeof s.endedAt === 'number' ? s.endedAt : new Date(s.endedAt).getTime()) : null
              const start = new Date(startMs).toLocaleString()
              const end = endMs ? new Date(endMs).toLocaleString() : '—'
              const dur = formatDur(startMs, endMs)
              return (
                <tr key={s.id}>
                  <td>{s.internalId}</td>
                  <td>{s.employeeName}</td>
                  <td>{s.department || ''}</td>
                  <td>{start}</td>
                  <td>{end}</td>
                  <td>{dur}</td>
                  <td>{endMs ? 'Finalizada' : 'En curso'}</td>
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
