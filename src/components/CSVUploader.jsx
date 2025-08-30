import Papa from 'papaparse'

export default function CSVUploader({ onParsed }) {
  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = (res.data ?? []).map(row => ({
          id: crypto.randomUUID(),
          internalId: String(row.internalId ?? "").trim(),
          firstName: String(row.firstName ?? "").trim(),
          lastName: String(row.lastName ?? "").trim(),
          department: String(row.department ?? "").trim(),
          hasRoomAccess: String(row.hasRoomAccess ?? "true").toLowerCase() === "true",
          createdAt: Date.now(),
        }))
        onParsed?.(rows)
      },
      error: () => alert('No se pudo leer el CSV'),
    })
  }
  return <input type="file" accept=".csv" onChange={onFile} />
}
