import { useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import EmployeeForm from '../components/EmployeeForm'
import { exportAccessHistoryPDF, exportEmployeeSessionsPDF, exportEmployeeReportPDF } from '../utils/pdf'
import BackButton from '../components/BackButton'   // ⬅️ NUEVO

export default function EmployeeDetail() {
  const { id } = useParams()
  const employees = useAppStore(s=>s.employees)
  const logs = useAppStore(s=>s.accessLogs)
  const updateEmployee = useAppStore(s=>s.updateEmployee)

  // NUEVO: historial de conexiones del empleado
  const sessionsByEmployeeId = useAppStore(s => s.sessionsByEmployeeId)

  const emp = employees.find(e => e.id === id)
  const [editable, setEditable] = useState(emp)

  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const rangedAccess = useMemo(() => {
    if (!emp) return []
    const s = from ? new Date(from).getTime() : -Infinity
    const e = to ? new Date(to).getTime() : Infinity
    return logs.filter(l => l.employeeId === emp.id && l.at >= s && l.at <= e)
  }, [logs, emp?.id, from, to])

  // NUEVO: sesiones del empleado (todas, puedes filtrarlas si quieres)
  const sessions = useMemo(() => {
    if (!emp) return []
    const list = sessionsByEmployeeId(emp.id)
    return [...list].sort((a,b)=> (b.startedAt || 0) - (a.startedAt || 0))
  }, [emp?.id, sessionsByEmployeeId])

  if (!emp) return <p className="p-6">Empleado no encontrado.</p>

  return (
    <div className="p-6 space-y-6 container">
      {/* 🔙 Botón de volver al listado */}
      <BackButton to="/employees" />   {/* ⬅️ NUEVO */}

      <h1 className="text-2xl font-semibold">Empleado • {emp.firstName} {emp.lastName}</h1>

      <div className="card">
        <h3 style={{marginTop:0}}>Editar información</h3>
        <EmployeeForm value={editable} onChange={setEditable} onSubmit={() => updateEmployee(emp.id, editable)} submitLabel="Actualizar" />
      </div>

      {/* Historial de accesos (con rango y PDF) */}
      <div className="card" style={{display:'grid', gap:12}}>
        <h3 style={{marginTop:0}}>Historial de accesos</h3>
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
          <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          <input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} />
          <button className="btn" onClick={() => exportAccessHistoryPDF(emp, rangedAccess)}>Exportar PDF (Accesos)</button>
        </div>
        <table className="table">
          <thead><tr><th>Fecha/Hora</th><th>Resultado</th></tr></thead>
        <tbody>
            {rangedAccess.map(r=>(
              <tr key={r.id}><td>{new Date(r.at).toLocaleString()}</td><td>{r.status}</td></tr>
            ))}
            {rangedAccess.length === 0 && <tr><td colSpan="2" style={{opacity:.7}}>Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* NUEVO: Historial de conexiones (con PDF) */}
      <div className="card" style={{display:'grid', gap:12}}>
        <h3 style={{marginTop:0}}>Historial de conexiones</h3>
        <div>
          <button className="btn" onClick={() => exportEmployeeSessionsPDF(emp, sessions)}>Exportar PDF (Conexiones)</button>
        </div>
        <table className="table">
          <thead><tr><th>Inicio</th><th>Fin</th><th>Duración</th><th>Estado</th></tr></thead>
          <tbody>
            {sessions.map(s => {
              const start = new Date(s.startedAt).toLocaleString()
              const end = s.endedAt ? new Date(s.endedAt).toLocaleString() : '—'
              const durMs = (s.endedAt ?? Date.now()) - s.startedAt
              const mins = Math.floor(durMs / 60000)
              return (
                <tr key={s.id}>
                  <td>{start}</td>
                  <td>{end}</td>
                  <td>{mins} min</td>
                  <td>{s.endedAt ? 'Finalizada' : 'En curso'}</td>
                </tr>
              )
            })}
            {sessions.length === 0 && <tr><td colSpan="4" style={{opacity:.7}}>Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* OPCIONAL: botón para sacar todo en un solo PDF */}
      <div className="card">
        <h3 style={{marginTop:0}}>Reporte combinado</h3>
        <button className="btn" onClick={() => exportEmployeeReportPDF(emp, rangedAccess, sessions)}>
          Exportar PDF (Accesos + Conexiones)
        </button>
      </div>
    </div>
  )
}
