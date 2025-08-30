import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

const GREEN = '#16a34a'
const GREEN_SOFT = '#e8f7ee'
const BORDER = '#0b0b0b'

export default function EmployeePortal() {
  const { employeeId } = useParams()
  const nav = useNavigate()

  const employees = useAppStore(s => s.employees)
  const endEmpSession = useAppStore(s => s.employeeEndSession)
  const sessionsByEmployeeId = useAppStore(s => s.sessionsByEmployeeId)
  const accessLogs = useAppStore(s => s.accessLogs)

  const emp = employees.find(e => e.id === employeeId)
  const sessions = sessionsByEmployeeId(employeeId) || []

  // últimos accesos (puedes elegir sessions o accessLogs)
  const recent = useMemo(() => {
    // Mezcla sesiones y logs si quieres; aquí uso sesiones (3 últimos)
    return [...sessions]
      .sort((a,b)=> b.startedAt - a.startedAt)
      .slice(0, 3)
      .map(s => ({
        date: new Date(s.startedAt),
        status: s.endedAt ? 'Exitoso' : 'En curso'
      }))
  }, [sessions])

  const onLogout = () => {
    endEmpSession()
    nav('/login')
  }

  if (!emp) {
    return (
      <div className="container">
        <div className="card">
          <p>No se encontró el empleado.</p>
        </div>
      </div>
    )
  }

  const ingreso = emp?.service?.startDate ? new Date(emp.service.startDate) : null
  const accesoAutorizado = !!emp.hasRoomAccess

  return (
    <div className="container" style={{ display:'grid', gap:16 }}>
      {/* Header */}
      <div
        className="card"
        style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          borderColor: BORDER, background: GREEN_SOFT
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div
            aria-hidden
            style={{
              width:28, height:28, borderRadius:'50%',
              border:`2px solid ${GREEN}`, display:'grid', placeItems:'center'
            }}
          >
            <span style={{ width:10, height:10, background:GREEN, borderRadius:'50%' }} />
          </div>
          <div>
            <div style={{ fontWeight:800 }}>ROOM_911</div>
            <small style={{ opacity:.75 }}>Employee Portal</small>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span className="muted">Bienvenido,</span>
          <strong>{emp.firstName}</strong>
          <button className="btn btn--light" onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </div>

      {/* Grid 2 columnas */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Mi información */}
        <div className="card" style={{ borderColor: BORDER }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ color:GREEN }}>🧾</span>
            <h3 style={{ margin:0 }}>Mi Información</h3>
          </div>

          <div style={{ display:'grid', gap:10 }}>
            <div>
              <div style={{ fontSize:12, opacity:.75 }}>ID Empleado</div>
              <div style={{ fontWeight:700 }}>{emp.internalId || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize:12, opacity:.75 }}>Departamento</div>
              <div style={{ fontWeight:700 }}>{emp.department || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize:12, opacity:.75 }}>Fecha de Ingreso</div>
              <div style={{ fontWeight:700 }}>
                {ingreso ? ingreso.toISOString().slice(0,10) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Estado de acceso */}
        <div className="card" style={{ borderColor: BORDER, display:'grid', placeItems:'center' }}>
          <div style={{ width:'100%' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={{ color:GREEN }}>🛡️</span>
              <h3 style={{ margin:0 }}>Estado de Acceso</h3>
            </div>

            <div style={{ display:'grid', gap:10, placeItems:'center' }}>
              <span
                style={{
                  display:'inline-block',
                  padding:'10px 14px',
                  borderRadius:999,
                  border:`1px solid ${accesoAutorizado ? GREEN : '#b91c1c'}`,
                  background: accesoAutorizado ? GREEN : '#fee2e2',
                  color: accesoAutorizado ? '#fff' : '#7f1d1d',
                  fontWeight:900,
                  letterSpacing:.3
                }}
              >
                {accesoAutorizado ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}
              </span>
              <small style={{ opacity:.75, textAlign:'center' }}>
                {accesoAutorizado
                  ? 'Tienes autorización para acceder al ROOM_911'
                  : 'No tienes autorización para acceder al ROOM_911'}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Accesos recientes */}
      <div className="card" style={{ borderColor: BORDER }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ color:GREEN }}>⏱️</span>
          <h3 style={{ margin:0 }}>Accesos Recientes</h3>
        </div>

        <div style={{ display:'grid', gap:10 }}>
          {recent.length === 0 && (
            <div className="muted" style={{ fontSize:14 }}>Sin registros.</div>
          )}

          {recent.map((r, i) => (
            <div
              key={i}
              style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 10px'
              }}
            >
              <div>
                <div style={{ fontWeight:700 }}>
                  {r.date.toISOString().slice(0,10)}
                </div>
                <small className="muted">
                  {r.date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                </small>
              </div>
              <span
                className="badge"
                style={{
                  background: r.status === 'Exitoso' ? GREEN_SOFT : '#fffbe6',
                  color: r.status === 'Exitoso' ? GREEN : '#92400e',
                  borderColor: r.status === 'Exitoso' ? 'rgba(22,163,74,.25)' : '#f59e0b'
                }}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Instrucciones */}
      <div className="card" style={{ borderColor: BORDER }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ color:GREEN }}>📋</span>
          <h3 style={{ margin:0 }}>Instrucciones de Acceso</h3>
        </div>

        <p className="muted" style={{ marginTop:0 }}>
          Cómo acceder al ROOM_911 de forma segura
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontWeight:700, marginBottom:6 }}>Procedimiento de Acceso:</div>
            <ol style={{ margin:'0 0 0 18px', padding:0, lineHeight:1.8 }}>
              <li>Acércate al lector de tarjetas del ROOM_911</li>
              <li>Presenta tu tarjeta de identificación</li>
              <li>Espera la confirmación del sistema</li>
              <li>Ingresa solo si el acceso es autorizado</li>
            </ol>
          </div>

          <div>
            <div style={{ fontWeight:700, marginBottom:6 }}>Medidas de Seguridad:</div>
            <ul style={{ margin:'0 0 0 18px', padding:0, lineHeight:1.8 }}>
              <li>No compartas tu tarjeta de acceso</li>
              <li>Reporta tarjetas perdidas inmediatamente</li>
              <li>No permitas el acceso a personal no autorizado</li>
              <li>Sigue todos los protocolos de seguridad</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
