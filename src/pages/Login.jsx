import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function Login() {
  const [mode, setMode] = useState('admin') // 'admin' | 'employee'
  const [username, setU] = useState('')
  const [password, setP] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [internalId, setInternalId] = useState('')
  const [error, setError] = useState('')

  const loginAdmin = useAppStore(s => s.login)
  const loginEmp = useAppStore(s => s.employeeLoginByInternalId)
  const nav = useNavigate()

  // Limpia errores al cambiar de modo o editar campos
  useEffect(() => { setError('') }, [mode])
  useEffect(() => { if (error) setError('') }, [username, password, internalId])

  const isValid = useMemo(() => {
    if (mode === 'admin') return username.trim().length > 0 && password.length > 0
    return internalId.trim().length > 0
  }, [mode, username, password, internalId])

  const onSubmit = (e) => {
    e.preventDefault()

    if (mode === 'admin') {
      const ok = loginAdmin(username.trim(), password)
      if (ok) {
        nav('/')
      } else {
        setError('Credenciales de administrador inválidas')
      }
      return
    }

    // --- Empleado ---
    const id = internalId.trim()
    if (!id) {
      setError('Ingresa tu Internal ID')
      return
    }
    const res = loginEmp(id)
    if (!res?.ok) {
      setError('No se encontró un empleado con ese Internal ID')
      return
    }
    const emp = res.employee
    nav(`/employee/portal/${emp.id}`)
  }

  return (
    <div className="container" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
      <form
        onSubmit={onSubmit}
        className="card"
        style={{
          width: 420,
          display: 'grid',
          gap: 14,
          borderRadius: 16,
          border: '1px solid #0b0b0b',
          boxShadow: '0 12px 36px rgba(0,0,0,.15)',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Header verde/negro con logo */}
        <div
          className="section-dark"
          style={{
            padding: '20px 16px',
            background: 'linear-gradient(135deg, #0b0b0b 0%, #111 45%, #0b7a35 100%)',
            borderBottom: '1px solid rgba(255,255,255,.15)',
            color: '#fff',
            display: 'grid',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src="/Img/Logo2.png" alt="Room 911" style={{ width: 84, height: 84, objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,.35))' }} />
          </div>
          <h1 style={{ margin: 0, textAlign: 'center', fontSize: 20, letterSpacing: .2 }}>ROOM_911</h1>
          <p style={{ margin: 0, opacity: .8, textAlign: 'center', fontSize: 12 }}>Acceso del administrador o empleado</p>
        </div>

        {/* Body */}
        <div style={{ display: 'grid', gap: 12, padding: 16 }}>
          {/* Tabs de rol */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              className="btn"
              onClick={() => setMode('admin')}
              aria-pressed={mode === 'admin'}
              style={{
                ...(mode === 'admin'
                  ? { background: '#16a34a', borderColor: '#0b7a35' }
                  : { background: '#fff', color: '#0b0b0b', borderColor: '#e6e6e6' })
              }}
            >
              Administrador
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setMode('employee')}
              aria-pressed={mode === 'employee'}
              style={{
                ...(mode === 'employee'
                  ? { background: '#16a34a', borderColor: '#0b7a35' }
                  : { background: '#fff', color: '#0b0b0b', borderColor: '#e6e6e6' })
              }}
            >
              Empleado
            </button>
          </div>

          {/* Campos según rol */}
          {mode === 'admin' ? (
            <>
              <div>
                <label style={{ fontSize: 12, opacity: .8 }}>Usuario (admin)</label>
                <input
                  className="input"
                  placeholder="admin"
                  value={username}
                  onChange={e => setU(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: 12, opacity: .8 }}>Contraseña</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                  <input
                    className="input"
                    placeholder="••••••••"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setP(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowPass(s => !s)}
                    title={showPass ? 'Ocultar' : 'Mostrar'}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{ background: '#fff', color: '#0b0b0b', borderColor: '#e6e6e6' }}
                  >
                    {showPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ fontSize: 12, opacity: .8 }}>Internal ID (empleado)</label>
                <input
                  className="input"
                  placeholder="Ej: EMP-00123"
                  value={internalId}
                  onChange={e => setInternalId(e.target.value)}
                  autoFocus
                />
                <p style={{ opacity: .7, marginTop: 6, fontSize: 12 }}>
                  Tu supervisor puede darte tu <strong>Internal ID</strong>.
                </p>
              </div>
            </>
          )}

          {/* Error inline */}
          {error && (
            <div
              role="alert"
              style={{
                border: '1px solid #b91c1c',
                background: '#fee2e2',
                color: '#7f1d1d',
                padding: '8px 10px',
                borderRadius: 10,
                fontSize: 13
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="btn btn--primary" disabled={!isValid}>
            Ingresar
          </button>

          {/* Tip opcional para credenciales por defecto (puedes quitarlo si no lo quieres) */}
          <div className="muted" style={{ fontSize: 12, textAlign: 'center' }}>
          </div>
        </div>
      </form>
    </div>
  )
}
