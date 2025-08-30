import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function Navbar() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const adminSession = useAppStore(s => s.session)
  const logoutAdmin = useAppStore(s => s.logout)
  const activeEmp = useAppStore(s => s.employeeSessionActive)
  const employees = useAppStore(s => s.employees)
  const emp = activeEmp ? employees.find(e => e.id === activeEmp.employeeId) : null

  return (
    <nav style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
      <div className="container" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <strong>ROOM_911</strong>

          
          {/* Link del empleado si hay sesión activa */}
          {emp && (
            <Link
              to={`/employee/portal/${emp.id}`}
              style={{ opacity: pathname.startsWith('/employee/portal') ? 1 : .7 }}
            >
              Portal Empleado
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {(adminSession || emp) ? (
            <>
              {adminSession && (
                <button
                  className="btn"
                  onClick={() => { logoutAdmin(); nav('/login') }}
                >
                  Salir Admin
                </button>
              )}
              {emp && <Link className="btn" to={`/employee/portal/${emp.id}`}>Mi portal</Link>}
            </>
          ) : (
            <Link className="btn" to="/login">Ingresar</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
