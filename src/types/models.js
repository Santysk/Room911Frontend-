export const DepartmentList = ["Production A", "Production B", "Quality", "R&D"]

export const defaultAdminUsers = [
  { id: "u1", username: "admin", password: "admin123", role: "admin_room_911" },
]

// 🆕: estructura con datos personales + servicio
export const newEmployee = () => ({
  id: crypto.randomUUID(),
  // Datos personales
  firstName: "",
  lastName: "",
  internalId: "",          // identificador interno para login empleado
  documentId: "",          // cédula / DNI
  phone: "",
  email: "",

  // Organización
  department: DepartmentList[0],
  jobTitle: "",            // cargo/puesto
  shift: "Diurno",         // Diurno | Nocturno | Rotativo

  // Servicio
  service: {
    startDate: "",         // yyyy-mm-dd
    endDate: "",           // opcional
    contractType: "Temporal", // Temporal | Indefinido | Prácticas
    supervisorName: "",
    supervisorPhone: "",
  },

  // Acceso
  hasRoomAccess: true,
  notes: "",

  createdAt: Date.now(),
})

// (ya lo tienes)
export const accessLogEntry = (status, internalId, employee) => ({
  id: crypto.randomUUID(),
  at: Date.now(),
  status, // 'GRANTED' | 'DENIED' | 'NOT_REGISTERED'
  internalId,
  employeeId: employee?.id ?? null,
  employeeName: employee ? `${employee.firstName} ${employee.lastName}` : null,
})

export const employeeSessionEntry = ({ employee }) => ({
  id: crypto.randomUUID(),
  employeeId: employee.id,
  employeeName: `${employee.firstName} ${employee.lastName}`,
  internalId: employee.internalId,
  startedAt: Date.now(),
  endedAt: null,
})
