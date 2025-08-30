import { Navigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function ProtectedRouteEmployee({ children }) {
  const active = useAppStore(s => s.employeeSessionActive)
  const { employeeId } = useParams()

  if (!active) return <Navigate to="/login" replace />

  // Si la URL no coincide, redirige a la correcta
  if (employeeId !== active.employeeId) {
    return <Navigate to={`/employee/portal/${active.employeeId}`} replace />
  }

  return children
}
