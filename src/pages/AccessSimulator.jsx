import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { accessLogEntry } from '../types/models'
import BackButton from '../components/BackButton'

function isServiceActive(emp) {
  const now = new Date()
  const start = emp?.service?.startDate ? new Date(emp.service.startDate) : null
  const end = emp?.service?.endDate ? new Date(emp.service.endDate) : null
  if (!start) return false
  if (start > now) return false
  if (end && now > end) return false
  return true
}

function missingFields(emp) {
  const faltan = []
  if (!emp.documentId?.trim()) faltan.push('Documento')
  if (!emp.internalId?.trim()) faltan.push('Internal ID')
  if (!emp.firstName?.trim()) faltan.push('Nombre')
  if (!emp.lastName?.trim()) faltan.push('Apellido')
  if (!emp.department?.trim()) faltan.push('Departamento')
  if (!emp.service?.startDate) faltan.push('Inicio de servicio')
  return faltan
}

export default function AccessSimulator() {
  const employees = useAppStore(s => s.employees)
  const accessLogs = useAppStore(s => s.accessLogs)

  const simulateAccess = useAppStore(s => s.simulateAccessForEmployee)
  const recordAccessAttempt = useAppStore(s => s.recordAccessAttempt)
  const updateEmployee = useAppStore(s => s.updateEmployee)

  const sessionsByEmployeeId = useAppStore(s => s.sessionsByEmployeeId)
  const adminStartSessionForEmployee = useAppStore(s => s.adminStartSessionForEmployee)
  const adminEndSessionForEmployee   = useAppStore(s => s.adminEndSessionForEmployee)

  const [employeeId, setEmployeeId] = useState('')
  const [verified, setVerified] = useState(null)

  const selected = useMemo(
    () => employees.find(e => e.id === employeeId) || null,
    [employees, employeeId]
  )

  const lastLogs = useMemo(
    () => accessLogs.filter(l => l.employeeId === employeeId).slice(0, 10),
    [accessLogs, employeeId]
  )

  const lastSessions = useMemo(
    () => sessionsByEmployeeId(employeeId).slice(0, 10),
    [sessionsByEmployeeId, employeeId]
  )

  const doVerify = () => {
    if (!selected) return setVerified(null)
    const reasons = []
    const miss = missingFields(selected)
    if (miss.length) reasons.push(`Faltan campos: ${miss.join(', ')}`)
    if (!isServiceActive(selected)) reasons.push('Servicio inactivo (revisa fechas)')
    setVerified({ ok: reasons.length === 0, reasons })
  }

  const onToggleAccess = (enable) => {
    if (!selected) return
    updateEmployee(selected.id, { hasRoomAccess: !!enable })
    alert(enable ? 'Acceso habilitado.' : 'Acceso revocado.')
  }

  const onAllowOnce = () => {
    if (!selected) return
    const log = accessLogEntry('GRANTED', selected.internalId, selected)
    recordAccessAttempt(log)
    alert('Acceso permitido una sola vez y registrado en la bitácora.')
  }

  const onSimulateAccess = () => {
    if (!selected) return alert('Selecciona un empleado')
    const res = simulateAccess?.(selected.id)
    if (!res?.ok) return alert('No se pudo simular el acceso.')
    const label = res.status === 'GRANTED' ? 'Permitido' :
                  res.status === 'DENIED' ? 'Denegado' : 'No registrado'
    alert(`Acceso ${label}`)
  }

  const onStart = () => {
    if (!selected) return alert('Selecciona un empleado')
    const res = adminStartSessionForEmployee?.(selected.id)
    if (!res?.ok && res?.reason === 'ALREADY_OPEN') return alert('Ya hay una sesión abierta para este empleado.')
    if (!res?.ok) return alert('No se pudo iniciar la sesión.')
    alert('Sesión iniciada.')
  }

  const onEnd = () => {
    if (!selected) return alert('Selecciona un empleado')
    const res = adminEndSessionForEmployee?.(selected.id)
    if (!res?.ok) return alert('No hay sesión abierta para este empleado.')
    alert('Sesión finalizada.')
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      {/* 🔙 Botón para volver al Dashboard */}
      <BackButton to="/" />

      <h2>Simulador</h2>

      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="select"
            value={employeeId}
            onChange={e => { setEmployeeId(e.target.value); setVerified(null) }}
          >
            <option value="">— Selecciona un empleado —</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.internalId} — {e.firstName} {e.lastName} ({e.department})
              </option>
            ))}
          </select>

          {selected && (
            <span style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8 }}>
              Acceso a ROOM_911: <strong>{selected.hasRoomAccess ? 'Permitido' : 'Denegado'}</strong>
            </span>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={doVerify}>Verificar empleado</button>
            <button className="btn" onClick={onSimulateAccess} disabled={!selected}>Simular Acceso</button>
            <button className="btn" onClick={onStart} disabled={!selected}>Iniciar Sesión</button>
            <button className="btn" onClick={onEnd} disabled={!selected}>Finalizar Sesión</button>
          </div>
        </div>

        {/* Panel de verificación */}
        {selected && (
          <div className="card" style={{ background: '#fafafa', display: 'grid', gap: 8 }}>
            <h3 style={{ margin: 0 }}>Estado del empleado</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <div><strong>Nombre:</strong> {selected.firstName} {selected.lastName}</div>
                <div><strong>Documento:</strong> {selected.documentId || '—'}</div>
                <div><strong>Internal ID:</strong> {selected.internalId}</div>
              </div>
              <div>
                <div><strong>Departamento:</strong> {selected.department || '—'}</div>
                <div><strong>Cargo:</strong> {selected.jobTitle || '—'}</div>
                <div><strong>Turno:</strong> {selected.shift || '—'}</div>
              </div>
              <div>
                <div><strong>Inicio servicio:</strong> {selected.service?.startDate || '—'}</div>
                <div><strong>Fin servicio:</strong> {selected.service?.endDate || '—'}</div>
                <div><strong>Contrato:</strong> {selected.service?.contractType || '—'}</div>
              </div>
            </div>

            {verified && (
              <div style={{ marginTop: 6 }}>
                {verified.ok ? (
                  <div style={{ color: '#1a7f37' }}>✅ Verificación exitosa. Servicio activo y datos mínimos completos.</div>
                ) : (
                  <>
                    <div style={{ color: '#b91c1c' }}>❌ No elegible:</div>
                    <ul style={{ margin: '6px 0 0 16px' }}>
                      {verified.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <button
                className="btn"
                onClick={() => onToggleAccess(true)}
                disabled={!selected || (verified && !verified.ok)}
              >
                Habilitar acceso
              </button>
              <button
                className="btn"
                onClick={() => onToggleAccess(false)}
                disabled={!selected}
              >
                Revocar acceso
              </button>
              <button
                className="btn"
                onClick={onAllowOnce}
                disabled={!selected}
              >
                Permitir 1 vez
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tablas de historial */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Últimos accesos simulados</h3>
          <table className="table">
            <thead><tr><th>Fecha/Hora</th><th>Resultado</th></tr></thead>
            <tbody>
              {lastLogs.map(l => (
                <tr key={l.id}>
                  <td>{new Date(l.at).toLocaleString()}</td>
                  <td>{l.status === 'GRANTED' ? 'Permitido' : l.status === 'DENIED' ? 'Denegado' : 'No registrado'}</td>
                </tr>
              ))}
              {lastLogs.length === 0 && <tr><td colSpan="2" style={{ opacity: .7 }}>Sin registros.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Últimas sesiones simuladas</h3>
          <table className="table">
            <thead><tr><th>Inicio</th><th>Fin</th><th>Duración</th><th>Estado</th></tr></thead>
            <tbody>
              {lastSessions.map(s => {
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
              {lastSessions.length === 0 && <tr><td colSpan="4" style={{ opacity: .7 }}>Sin registros.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
