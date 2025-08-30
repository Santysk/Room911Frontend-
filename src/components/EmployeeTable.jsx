import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { exportEmployeesSummaryPDF } from '../utils/pdf' // ⬅️ IMPORTA AQUÍ

export default function EmployeeTable({ employees }) {
  const [q, setQ] = useState("")
  const [dept, setDept] = useState("ALL")

  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department).filter(Boolean))
    return ["ALL", ...Array.from(set)]
  }, [employees])

  const filtered = useMemo(() => {
    const words = q.toLowerCase().trim()
    return employees.filter(e => {
      const hay = `${e.internalId} ${e.firstName} ${e.lastName}`.toLowerCase()
      const okText = hay.includes(words)
      const okDept = dept === "ALL" || e.department === dept
      return okText && okDept
    })
  }, [employees, q, dept])

  const hasResults = filtered.length > 0

  const onExportClick = () => {
    try {
      // Si quieres incluir metadatos de filtro en el PDF:
      exportEmployeesSummaryPDF(filtered, { query: q, department: dept })
      // Si NO quieres metadatos, usa: exportEmployeesSummaryPDF(filtered)
      console.log('PDF exportado (vista filtrada)', { count: filtered.length })
    } catch (err) {
      console.error('Error exportando PDF:', err)
      alert('Ocurrió un error exportando el PDF. Revisa la consola.')
    }
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Buscar por id, nombre o apellido..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />

        <select
          className="select"
          value={dept}
          onChange={e => setDept(e.target.value)}
        >
          {departments.map(d => (
            <option key={d} value={d}>{d === "ALL" ? "Todos" : d}</option>
          ))}
        </select>

        <span style={{ marginLeft: 'auto', opacity: .75 }}>
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
        </span>

        <button
          type="button"
          className="btn"
          title="Exportar PDF de la vista filtrada"
          onClick={onExportClick}
          disabled={!hasResults}
          style={{ opacity: hasResults ? 1 : .6, cursor: hasResults ? 'pointer' : 'not-allowed' }}
        >
          PDF vista filtrada
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Internal ID</th>
            <th>Nombre</th>
            <th>Departamento</th>
            <th>Acceso</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(emp => (
            <tr key={emp.id}>
              <td>{emp.internalId}</td>
              <td>{emp.firstName} {emp.lastName}</td>
              <td>{emp.department}</td>
              <td>{emp.hasRoomAccess ? 'Permitido' : 'Denegado'}</td>
              <td>
                <Link to={`/employees/${emp.id}`} style={{ textDecoration: 'underline' }}>
                  Ver/Editar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <p style={{ opacity: .7, margin: 0 }}>Sin resultados.</p>
      )}
    </div>
  )
}
