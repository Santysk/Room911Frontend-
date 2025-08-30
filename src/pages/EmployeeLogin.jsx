import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function EmployeeLogin() {
  const [internalId, setInternalId] = useState("")
  const loginEmp = useAppStore(s=>s.employeeLoginByInternalId)
  const employees = useAppStore(s=>s.employees)
  const nav = useNavigate()

  const onSubmit = (e) => {
    e.preventDefault()
    const res = loginEmp(internalId.trim())
    if (!res.ok) {
      alert('No se encontró un empleado con ese Internal ID')
      return
    }
    const emp = employees.find(e => e.id === res.employee?.id || e.internalId === internalId.trim())
    if (!emp) { alert('Empleado no encontrado'); return }
    if (res.resumed) {
      alert('Sesión retomada. Ya había una conexión iniciada.')
    } else {
      alert('Conexión iniciada.')
    }
    nav(`/employee/portal/${emp.id}`)
  }

  return (
    <div className="container" style={{display:'grid', placeItems:'center', minHeight:'70vh'}}>
      <form onSubmit={onSubmit} className="card" style={{width:380, display:'grid', gap:12}}>
        <h2 style={{margin:0}}>Portal de Empleado</h2>
        <p style={{opacity:.8, marginTop:-6}}>Ingresa tu <strong>Internal ID</strong> para iniciar tu conexión.</p>
        <input className="input" placeholder="Internal ID" value={internalId} onChange={e=>setInternalId(e.target.value)} />
        <button className="btn">Ingresar</button>
      </form>
    </div>
  )
}
