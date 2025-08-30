import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Employees from './pages/Employees.jsx'
import EmployeeDetail from './pages/EmployeeDetail.jsx'
import AccessSimulator from './pages/AccessSimulator.jsx'
import EmployeePortal from './pages/EmployeePortal.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ProtectedRouteEmployee from './components/ProtectedRouteEmployee.jsx'
import Navbar from './components/Navbar.jsx'
import AdminSessions from './pages/AdminSessions.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rutas solo ADMIN */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
        <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
        <Route path="/access-sim" element={<ProtectedRoute><AccessSimulator /></ProtectedRoute>} />
        <Route path="/admin/sessions" element={<ProtectedRoute><AdminSessions /></ProtectedRoute>} />

        {/* Ruta solo EMPLEADO (requiere conexión activa) */}
        <Route path="/employee/portal/:employeeId" element={<ProtectedRouteEmployee><EmployeePortal /></ProtectedRouteEmployee>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
