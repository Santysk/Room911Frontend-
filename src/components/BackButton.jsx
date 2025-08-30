// src/components/BackButton.jsx
import { useNavigate } from 'react-router-dom'

export default function BackButton({ to = -1 }) {
  const nav = useNavigate()
  return (
    <button
      className="btn"
      onClick={() => nav(to)}
      style={{ marginBottom: 12 }}
    >
      ⬅ Volver
    </button>
  )
}
