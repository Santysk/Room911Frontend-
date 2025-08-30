import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { newEmployee } from '../types/models'
import EmployeeForm from '../components/EmployeeForm'
import EmployeeTable from '../components/EmployeeTable'
import CSVUploader from '../components/CSVUploader'
import { exportEmployeesSummaryPDF } from '../utils/pdf' // ✅ solo el de lista filtrada
import BackButton from '../components/BackButton'

export default function Employees() {
  const employees = useAppStore(s => s.employees)
  const addEmployee = useAppStore(s => s.addEmployee)
  const bulkImport = useAppStore(s => s.bulkImportEmployees)

  const [form, setForm] = useState(newEmployee())

  // ✅ PDF de la lista tal como se ve con los filtros
  const onExportFilteredListPDF = (filteredEmployees) => {
    // Si quieres enviar metadatos (búsqueda/departamento), puedes pasar un 2º parámetro:
    // exportEmployeesSummaryPDF(filteredEmployees, { query: q, department: dept })
    exportEmployeesSummaryPDF(filteredEmployees)
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      {/* 🔙 Botón de volver */}
      <BackButton to="/" />

      <h2>Empleados</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Crear nuevo</h3>
          <EmployeeForm
            value={form}
            onChange={setForm}
            onSubmit={() => {
              addEmployee(form)
              setForm(newEmployee()) // reset del formulario
            }}
          />
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Carga masiva (CSV)</h3>
          <CSVUploader onParsed={bulkImport} />
          <p style={{ opacity: .7, marginTop: 8 }}>
            <strong>Columnas CSV (datos personales, servicio y acceso):</strong><br />
            ID interno, nombre, apellido, ID del documento, teléfono, correo electrónico, departamento, 
            puesto, turno, fecha de inicio del servicio, fecha de fin del servicio, tipo de contrato del servicio, 
            nombre del supervisor del servicio, teléfono del supervisor del servicio, tiene acceso a la habitación, notas.
          </p>
        </div>
      </div>

      <div className="card">
        <EmployeeTable
          employees={employees}
          onExportListPDF={onExportFilteredListPDF} // ✅ solo este
        />
      </div>
    </div>
  )
}
