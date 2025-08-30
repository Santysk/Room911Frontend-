import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'

/** Paleta */
const GREEN = '#16a34a'
const GREEN_DARK = '#0b7a35'
const GREEN_SOFT = '#e8f7ee'
const BLACK = '#0b0b0b'
const WHITE = '#ffffff'

export default function Dashboard() {
  const session = useAppStore(s => s.session)
  const employees = useAppStore(s => s.employees || [])
  const accessLogs = useAppStore(s => s.accessLogs || [])
  const sessions = useAppStore(s => s.employeeSessions || [])

  const kpis = useMemo(() => {
    const total = employees.length
    const conAcceso = employees.filter(e => e.hasRoomAccess).length
    const sinAcceso = total - conAcceso
    const abiertas = sessions.filter(s => !s.endedAt).length

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const accesosHoy = accessLogs.filter(l => l.at >= hoy.getTime()).length

    const byDept = employees.reduce((acc, e) => {
      const d = e.department || '—'
      acc[d] = (acc[d] || 0) + 1
      return acc
    }, {})

    return { total, conAcceso, sinAcceso, abiertas, accesosHoy, byDept }
  }, [employees, accessLogs, sessions])

  const cardBase = {
    borderRadius: 16,
    background: WHITE,
    border: `1px solid #e6e6e6`,
    boxShadow: '0 8px 28px rgba(0,0,0,.06)'
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      {/* HERO */}
      <section
        className="card"
        style={{
          ...cardBase,
          display: 'grid',
          gap: 18,
          padding: '28px 24px',
          color: WHITE,
          background: `linear-gradient(135deg, ${BLACK} 0%, #111 45%, ${GREEN_DARK} 100%)`,
          border: `1px solid ${BLACK}`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* brillos verdes decorativos */}
        <div
          aria-hidden
          style={{
            position:'absolute', width:360, height:360, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(22,163,74,.25), transparent 60%)',
            top:-140, right:-100, filter:'blur(12px)'
          }}
        />
        <div
          aria-hidden
          style={{
            position:'absolute', width:260, height:260, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(22,163,74,.18), transparent 55%)',
            bottom:-120, left:-80, filter:'blur(10px)'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px', minWidth: 280 }}>
            <div style={{
              display:'inline-flex', gap:8, alignItems:'center',
              padding:'6px 10px', borderRadius:999,
              background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.2)'
            }}>
              <span style={{
                width:8, height:8, borderRadius:'50%', background: GREEN,
                boxShadow:`0 0 0 3px rgba(22,163,74,.3)`
              }}/>
              <small style={{ letterSpacing:.3 }}>ROOM_911 · Panel principal</small>
            </div>

            <h1
              style={{
                margin: '10px 0 6px 0',
                fontSize: 30,
                lineHeight: 1.15,
                color: WHITE,
                fontWeight: 900
              }}
            >
              Bienvenido{session?.username ? `, ${session.username}` : ''} ✨
            </h1>
            <p style={{ margin: 0, opacity: 0.9, color: WHITE }}>
              Panel de control de <strong>ROOM_911</strong>. Administra empleados, controla el acceso a la sala
              y genera reportes con un par de clics.
            </p>
          </div>

          {/* Imagen conservada */}
          <div
            aria-hidden
            style={{
              width: 200,
              height: 130,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,.25)',
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))',
              boxShadow: '0 16px 40px rgba(0,0,0,.35)'
            }}
          >
            <img
              src="/Img/Logo2.png"
              alt="Logo ROOM_911"
              style={{ width: 84, height: 84, objectFit: 'contain', filter:'drop-shadow(0 8px 16px rgba(0,0,0,.35))' }}
            />
          </div>
        </div>

        {/* Acciones rápidas */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn" to="/employees" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/icons/icono_sumar2.svg" alt="Agregar" style={{ width: 16, height: 16 }} />
            Crear / importar empleados
          </Link>

          <Link className="btn" to="/access-sim" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/icons/icono_simulador3.svg" alt="Simulador" style={{ width: 16, height: 16 }}/>
            Simulador
          </Link>

          <Link className="btn" to="/admin/sessions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/icons/icono_historial2.svg" alt="Historial" style={{ width: 16, height: 16 }}/>
            Historial de conexiones
          </Link>
        </div>
      </section>

      {/* KPIs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <div className="card" style={{ ...cardBase, padding: 18 }}>
          <div style={{ opacity: 0.7, fontSize: 13 }}>Empleados</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{kpis.total}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {kpis.conAcceso} con acceso · {kpis.sinAcceso} sin acceso
          </div>
        </div>

        <div className="card" style={{ ...cardBase, padding: 18 }}>
          <div style={{ opacity: 0.7, fontSize: 13 }}>Conexiones abiertas</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{kpis.abiertas}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Portal empleado</div>
        </div>

        <div className="card" style={{ ...cardBase, padding: 18 }}>
          <div style={{ opacity: 0.7, fontSize: 13 }}>Eventos de acceso hoy</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{kpis.accesosHoy}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Permitidos/Denegados</div>
        </div>

        <div className="card" style={{ ...cardBase, padding: 18 }}>
          <div style={{ opacity: 0.7, fontSize: 13 }}>Departamentos</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{Object.keys(kpis.byDept).length}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {Object.entries(kpis.byDept).slice(0, 2).map(([d, c]) => `${d}: ${c}`).join(' · ')}
            {Object.keys(kpis.byDept).length > 2 ? ' · …' : ''}
          </div>
        </div>
      </section>

      {/* Solo guía rápida */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <div
          className="card"
          style={{
            ...cardBase,
            padding: 18,
            border:`1px solid ${GREEN}`,
            background:`linear-gradient(180deg, ${GREEN_SOFT}, ${WHITE})`
          }}
        >
          <h3 style={{ margin: 0, color: BLACK }}>Guía rápida</h3>
          <ol style={{ margin: '0 0 4px 22px', padding: 0, lineHeight: 1.8, color: BLACK }}>
            <li>Registra o importa empleados en <Link to="/employees" style={{ color: GREEN_DARK }}>Empleados</Link>.</li>
            <li>Verifica y prueba accesos en <Link to="/access-sim" style={{ color: GREEN_DARK }}>Simulador</Link>.</li>
            <li>Consulta y exporta conexiones en <Link to="/admin/sessions" style={{ color: GREEN_DARK }}>Conexiones</Link>.</li>
          </ol>
          <p style={{ margin: 0, opacity: 0.8, color: BLACK }}>
            ¿Necesitas un reporte? Exporta PDF desde <em>Empleados</em> o <em>Conexiones</em>.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section
        className="card"
        style={{
          ...cardBase,
          padding: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          color: WHITE,
          background: `linear-gradient(90deg, ${BLACK} 0%, ${GREEN_DARK} 70%)`,
          border: `1px solid ${BLACK}`
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>¿Listo para comenzar?</div>
          <div style={{ opacity: 0.85, fontSize: 13 }}>Crea empleados o ejecuta una prueba en el simulador.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn" to="/employees">Ir a Empleados</Link>
          <Link className="btn" to="/access-sim">Abrir Simulador</Link>
        </div>
      </section>
    </div>
  )
}
