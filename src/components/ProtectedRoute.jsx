// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function ProtectedRoute({ children }) {
  const session = useAppStore(s => s.session)
  // Tu admin usa role: 'admin_room_911'
  const isAdmin = !!session && session.role === 'admin_room_911'
  if (!isAdmin) return <Navigate to="/login" replace />
  return children
}
