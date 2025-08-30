import { format } from 'date-fns'

export default function AccessLogTable({ logs, from, to }) {
  const start = from?.getTime?.() ?? -Infinity
  const end = to?.getTime?.() ?? Infinity
  const filtered = logs.filter(l => l.at >= start && l.at <= end)

  return (
    <table className="table">
      <thead><tr><th>Fecha/Hora</th><th>Internal ID</th><th>Empleado</th><th>Resultado</th></tr></thead>
      <tbody>
        {filtered.map(l=>(
          <tr key={l.id}>
            <td>{format(l.at, 'yyyy-MM-dd HH:mm:ss')}</td>
            <td>{l.internalId}</td>
            <td>{l.employeeName ?? '—'}</td>
            <td>{l.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
