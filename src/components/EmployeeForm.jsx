import { useMemo } from 'react'
import { DepartmentList, newEmployee as defaults } from '../types/models'

export default function EmployeeForm({ value, onChange, onSubmit, submitLabel = 'Guardar' }) {
  // Compatibilidad: mezcla defaults + value (incluye objetos anidados)
  const v = useMemo(() => ({
    ...defaults(),
    ...value,
    service: { ...defaults().service, ...(value?.service || {}) }
  }), [value])

  const set = (field, val) => onChange?.({ ...v, [field]: val })
  const setService = (field, val) => onChange?.({ ...v, service: { ...v.service, [field]: val } })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Validaciones mínimas
    if (!v.internalId.trim()) return alert('Internal ID es obligatorio')
    if (!v.firstName.trim() || !v.lastName.trim()) return alert('Nombre y Apellido son obligatorios')
    if (!v.service.startDate) return alert('Fecha de inicio de servicio es obligatoria')
    onSubmit?.(v)
  }

  return (
    <form onSubmit={handleSubmit} className="grid" style={{ display:'grid', gap:12 }}>
      {/* Datos personales */}
      <fieldset className="card" style={{ display:'grid', gap:8 }}>
        <legend><strong>Datos personales</strong></legend>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <input className="input" placeholder="Nombre" value={v.firstName} onChange={e=>set('firstName', e.target.value)} />
          <input className="input" placeholder="Apellido" value={v.lastName} onChange={e=>set('lastName', e.target.value)} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <input className="input" placeholder="Internal ID" value={v.internalId} onChange={e=>set('internalId', e.target.value)} />
          <input className="input" placeholder="Documento (DNI/Cédula)" value={v.documentId} onChange={e=>set('documentId', e.target.value)} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <input className="input" type="tel" placeholder="Teléfono" value={v.phone} onChange={e=>set('phone', e.target.value)} />
          <input className="input" type="email" placeholder="Email" value={v.email} onChange={e=>set('email', e.target.value)} />
        </div>
      </fieldset>

      {/* Datos del servicio */}
      <fieldset className="card" style={{ display:'grid', gap:8 }}>
        <legend><strong>Datos del servicio</strong></legend>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <select className="select" value={v.department} onChange={e=>set('department', e.target.value)}>
            {DepartmentList.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input className="input" placeholder="Cargo / Puesto" value={v.jobTitle} onChange={e=>set('jobTitle', e.target.value)} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          <select className="select" value={v.shift} onChange={e=>set('shift', e.target.value)}>
            <option>Diurno</option><option>Nocturno</option><option>Rotativo</option>
          </select>
          <input className="input" type="date" placeholder="Inicio de servicio" value={v.service.startDate} onChange={e=>setService('startDate', e.target.value)} />
          <input className="input" type="date" placeholder="Fin de servicio (opcional)" value={v.service.endDate} onChange={e=>setService('endDate', e.target.value)} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          <select className="select" value={v.service.contractType} onChange={e=>setService('contractType', e.target.value)}>
            <option>Temporal</option><option>Indefinido</option><option>Prácticas</option>
          </select>
          <input className="input" placeholder="Supervisor(a)" value={v.service.supervisorName} onChange={e=>setService('supervisorName', e.target.value)} />
          <input className="input" placeholder="Tel. supervisor" value={v.service.supervisorPhone} onChange={e=>setService('supervisorPhone', e.target.value)} />
        </div>
      </fieldset>

      {/* Acceso */}
      <fieldset className="card" style={{ display:'grid', gap:8 }}>
        <legend><strong>Acceso</strong></legend>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <label style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input type="checkbox" checked={v.hasRoomAccess} onChange={e=>set('hasRoomAccess', e.target.checked)} />
            Tiene acceso a ROOM_911
          </label>
          <input className="input" placeholder="Notas (opcional)" value={v.notes} onChange={e=>set('notes', e.target.value)} />
        </div>
      </fieldset>

      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button className="btn" type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}
