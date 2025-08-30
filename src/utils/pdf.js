// src/utils/pdf.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable' // uso explícito de la función

/* ============ Helpers comunes ============ */
function addPageNumbers(doc) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    const w = doc.internal.pageSize.getWidth()
    const h = doc.internal.pageSize.getHeight()
    doc.text(`Página ${i} de ${pageCount}`, w - 20, h - 10)
  }
}

function ts() {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`
}

/* Para formatear duración en sesiones */
function fmtDurationMs(ms) {
  const mins = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

/* ============ 1) PDF: Historial de accesos (por empleado) ============ */
export function exportAccessHistoryPDF(employee, rows) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text('ROOM_911 - Historial de accesos', 14, 16)
  doc.setFontSize(12)
  doc.text(`Empleado: ${employee?.firstName ?? ''} ${employee?.lastName ?? ''} (${employee?.internalId ?? ''})`, 14, 24)

  const body = (rows ?? []).map(r => [
    new Date(r.at).toLocaleString(),
    String(r.internalId ?? ''),
    String(r.status ?? '')
  ])

  autoTable(doc, {
    startY: 30,
    head: [['Fecha/Hora','Internal ID','Resultado']],
    body
  })

  addPageNumbers(doc)
  doc.save(`historial_accesos_${employee?.internalId ?? 'NA'}_${ts()}.pdf`)
}

/* ============ 2) PDF: Historial de conexiones (por empleado) ============ */
export function exportEmployeeSessionsPDF(employee, sessions) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text('ROOM_911 - Historial de conexiones', 14, 16)
  doc.setFontSize(12)
  doc.text(`Empleado: ${employee?.firstName ?? ''} ${employee?.lastName ?? ''} (${employee?.internalId ?? ''})`, 14, 24)

  const body = (sessions ?? []).map(s => {
    const start = new Date(s.startedAt).toLocaleString()
    const end = s.endedAt ? new Date(s.endedAt).toLocaleString() : '—'
    const durMs = (s.endedAt ?? Date.now()) - s.startedAt
    const mins = Math.max(0, Math.floor(durMs / 60000))
    return [start, end, `${mins} min`, s.endedAt ? 'Finalizada' : 'En curso']
  })

  autoTable(doc, {
    startY: 30,
    head: [['Inicio','Fin','Duración','Estado']],
    body
  })

  addPageNumbers(doc)
  doc.save(`historial_conexiones_${employee?.internalId ?? 'NA'}_${ts()}.pdf`)
}

/* ============ 3) PDF: Reporte combinado (Accesos + Conexiones) ============ */
export function exportEmployeeReportPDF(employee, accessRows, sessionRows) {
  const doc = new jsPDF()

  // Portada
  doc.setFontSize(16)
  doc.text('ROOM_911 - Reporte de Empleado', 14, 16)
  doc.setFontSize(12)
  doc.text(`Empleado: ${employee?.firstName ?? ''} ${employee?.lastName ?? ''}`, 14, 26)
  doc.text(`Internal ID: ${employee?.internalId ?? ''}`, 14, 34)
  doc.text(`Departamento: ${employee?.department ?? ''}`, 14, 42)

  // Sección 1: Accesos
  doc.addPage()
  doc.setFontSize(14)
  doc.text('Sección 1 - Historial de accesos', 14, 16)
  const accessBody = (accessRows ?? []).map(r => [
    new Date(r.at).toLocaleString(),
    String(r.internalId ?? ''),
    String(r.status ?? '')
  ])
  autoTable(doc, {
    startY: 24,
    head: [['Fecha/Hora','Internal ID','Resultado']],
    body: accessBody
  })

  // Sección 2: Conexiones
  doc.addPage()
  doc.setFontSize(14)
  doc.text('Sección 2 - Historial de conexiones', 14, 16)
  const sessionsBody = (sessionRows ?? []).map(s => {
    const start = new Date(s.startedAt).toLocaleString()
    const end = s.endedAt ? new Date(s.endedAt).toLocaleString() : '—'
    const durMs = (s.endedAt ?? Date.now()) - s.startedAt
    const mins = Math.max(0, Math.floor(durMs / 60000))
    return [start, end, `${mins} min`, s.endedAt ? 'Finalizada' : 'En curso']
  })
  autoTable(doc, {
    startY: 24,
    head: [['Inicio','Fin','Duración','Estado']],
    body: sessionsBody
  })

  addPageNumbers(doc)
  doc.save(`reporte_empleado_${employee?.internalId ?? 'NA'}_${ts()}.pdf`)
}

/* ============ 4) PDF: Lista de empleados (vista filtrada) ============ */
export function exportEmployeesSummaryPDF(filteredEmployees, opts = {}) {
  if (!filteredEmployees || filteredEmployees.length === 0) {
    alert('No hay resultados para exportar.')
    return
  }

  const { query = '', department = 'Todos' } = opts
  const doc = new jsPDF()

  // Encabezado + metadatos
  doc.setFontSize(14)
  doc.text('ROOM_911 - Listado de empleados (vista filtrada)', 14, 16)
  doc.setFontSize(11)
  doc.text(`Filtro – Búsqueda: ${query || '—'}  ·  Departamento: ${department}`, 14, 22)

  // Tabla
  const body = filteredEmployees.map(e => ([
    String(e.internalId ?? ''),
    `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
    String(e.department ?? ''),
    e.hasRoomAccess ? 'Permitido' : 'Denegado'
  ]))

  autoTable(doc, {
    startY: 28,
    head: [['Internal ID', 'Nombre', 'Departamento', 'Acceso']],
    body
  })

  // Resumen
  const totalsByDept = filteredEmployees.reduce((acc, e) => {
    const d = e.department ?? '—'
    acc[d] = (acc[d] ?? 0) + 1
    return acc
  }, {})
  const totalsAccess = filteredEmployees.reduce((acc, e) => {
    const k = e.hasRoomAccess ? 'Permitido' : 'Denegado'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  let y = (doc.lastAutoTable?.finalY ?? 28) + 8
  doc.setFontSize(12)
  doc.text('Resumen:', 14, y); y += 6
  Object.entries(totalsByDept).forEach(([dept, count]) => {
    doc.text(`• ${dept}: ${count}`, 18, y); y += 6
  })
  doc.text(`• Acceso Permitido: ${totalsAccess.Permitido ?? 0}`, 18, y); y += 6
  doc.text(`• Acceso Denegado: ${totalsAccess.Denegado ?? 0}`, 18, y)

  addPageNumbers(doc)
  doc.save(`empleados_filtrado_${ts()}.pdf`)
}

/* ============ 5) PDF: Historial de conexiones (vista filtrada) ============ */
export function exportSessionsSummaryPDF(filteredSessions, opts = {}) {
  if (!filteredSessions || filteredSessions.length === 0) {
    alert('No hay sesiones para exportar.')
    return
  }

  const { query = '', department = 'Todos', status = 'Todos', from = '', to = '' } = opts
  const doc = new jsPDF()

  // Título + filtros usados
  doc.setFontSize(14)
  doc.text('ROOM_911 - Historial de conexiones (vista filtrada)', 14, 16)
  doc.setFontSize(11)
  doc.text(
    `Filtro – Búsqueda: ${query || '—'} · Depto: ${department} · Estado: ${status} · Desde: ${from || '—'} · Hasta: ${to || '—'}`,
    14, 22
  )

  // Tabla con sesiones
  const body = filteredSessions.map(s => {
    const start = s.startedAt ? new Date(s.startedAt).toLocaleString() : '—'
    const end = s.endedAt ? new Date(s.endedAt).toLocaleString() : '—'
    const dur = s.startedAt ? fmtDurationMs((s.endedAt ?? Date.now()) - s.startedAt) : '—'
    return [
      String(s.internalId ?? ''),
      String(s.employeeName ?? ''),
      String(s.department ?? ''),
      start,
      end,
      dur,
      s.endedAt ? 'Finalizada' : 'En curso',
    ]
  })

  autoTable(doc, {
    startY: 28,
    head: [['Internal ID', 'Nombre', 'Departamento', 'Inicio', 'Fin', 'Duración', 'Estado']],
    body,
  })

  // Totales
  const total = filteredSessions.length
  const abiertas = filteredSessions.filter(s => !s.endedAt).length
  const cerradas = total - abiertas
  let y = (doc.lastAutoTable?.finalY ?? 28) + 8
  doc.setFontSize(12)
  doc.text(`Totales: ${total}   • En curso: ${abiertas}   • Finalizadas: ${cerradas}`, 14, y)

  addPageNumbers(doc)
  doc.save(`conexiones_filtrado_${ts()}.pdf`)
}
