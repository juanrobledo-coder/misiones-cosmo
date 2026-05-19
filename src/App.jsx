import { useState } from 'react'
import { useTareas } from './useTareas'
import { useAuth } from './useAuth'
import { supabaseConfigurado } from './supabase'
import FormularioTarea from './components/FormularioTarea'
import TareaCard from './components/TareaCard'
import LoginAdmin from './components/LoginAdmin'
import PantallaSetup from './components/PantallaSetup'
import styles from './App.module.css'

const FILTROS = [
  { key: 'todas',     label: 'Todas',        icono: '◈' },
  { key: 'pendiente', label: 'A tiempo',      icono: '○' },
  { key: 'proxima',   label: 'Esta semana',   icono: '◑' },
  { key: 'hoy',       label: 'Para hoy',      icono: '●' },
  { key: 'vencida',   label: 'Atrasadas',     icono: '✕' },
  { key: 'expirada',  label: 'Archivadas',    icono: '◻' },
]

export default function App() {
  // Show setup screen immediately if .env.local is missing
  if (!supabaseConfigurado) return <PantallaSetup />

  return <AppInterna />
}

function AppInterna() {
  const { tareas, contadores, cargando: cargandoTareas, dbError, agregarTarea, eliminarTarea, editarTarea, limpiarExpiradas } = useTareas()
  const { esAdmin, cargando: cargandoAuth, error: errorAuth, iniciarSesion, cerrarSesion, limpiarError } = useAuth()

  const [mostrarForm, setMostrarForm]     = useState(false)
  const [tareaEditando, setTareaEditando] = useState(null)
  const [mostrarLogin, setMostrarLogin]   = useState(false)
  const [filtro, setFiltro]               = useState('todas')
  const [busqueda, setBusqueda]           = useState('')
  const [vista, setVista]                 = useState('misiones')

  const tareasFiltradas = tareas
    .filter(t => filtro === 'todas' || t.estado === filtro)
    .filter(t =>
      !busqueda ||
      t.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.materia.toLowerCase().includes(busqueda.toLowerCase()) ||
      (t.descripcion || '').toLowerCase().includes(busqueda.toLowerCase())
    )

  async function handleAgregar(form) {
    await agregarTarea(form)
    setMostrarForm(false)
  }

  async function handleGuardarEdicion(campos) {
    await editarTarea(tareaEditando.id, campos)
    setTareaEditando(null)
  }

  async function handleLogin(email, contrasena) {
    const ok = await iniciarSesion(email, contrasena)
    if (ok) setMostrarLogin(false)
  }

  const numExpiradas = contadores.expirada || 0

  if (cargandoAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-main)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Cargando...
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>✦</span>
          <div>
            <div className={styles.logoTitle}>Misiones</div>
            <div className={styles.logoSub}>
              {esAdmin ? '— Modo Admin —' : '— Vista estudiante —'}
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          {FILTROS.map(f => {
            const count = f.key === 'todas' ? tareas.length : (contadores[f.key] || 0)
            return (
              <button
                key={f.key}
                className={`${styles.navItem} ${filtro === f.key ? styles.navActive : ''} ${vista === 'bitacora' ? styles.navDim : ''}`}
                onClick={() => { setVista('misiones'); setFiltro(f.key) }}
              >
                <span className={styles.navLabel}>
                  <span className={styles.navIcono}>{f.icono}</span>
                  {f.label}
                </span>
                {count > 0 && <span className={styles.navCount}>{count}</span>}
              </button>
            )
          })}

          <div className={styles.navDivider} />

          <button
            className={`${styles.navItem} ${vista === 'bitacora' ? styles.navActive : ''}`}
            onClick={() => setVista(v => v === 'bitacora' ? 'misiones' : 'bitacora')}
          >
            <span className={styles.navLabel}>
              <span className={styles.navIcono}>🗺</span>
              Bitácora
            </span>
          </button>
        </nav>

        {esAdmin && numExpiradas > 0 && (
          <button className={styles.limpiarBtn} onClick={limpiarExpiradas}>
            🗑 Limpiar {numExpiradas} archivada{numExpiradas !== 1 ? 's' : ''}
          </button>
        )}

        {/* Admin session — always visible including mobile */}
        <div className={styles.sessionRow}>
          {esAdmin ? (
            <>
              <div className={styles.adminBadge}>
                <span className={styles.adminDot} />
                Admin activo
              </div>
              <button className={styles.btnSesion} onClick={cerrarSesion}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <button className={styles.btnSesion} onClick={() => setMostrarLogin(true)}>
              Acceso admin
            </button>
          )}
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerNote}>
            Las misiones se archivan automáticamente <strong>5 días</strong> después de la entrega.
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>

        {/* Hero header */}
        <div className={styles.hero}>
          <span className={styles.heroSupra}>bitácora viajera</span>
          <h1 className={styles.heroTitle}>Misiones</h1>
        </div>

        {vista === 'bitacora' ? (
          <div className={styles.bitacoraPlaceholder}>
            <div className={styles.bitacoraIcon}>🗺</div>
            <h2>Bitácora Viajera</h2>
            <p>Esta sección estará disponible pronto.</p>
          </div>
        ) : (
          <>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h2 className={styles.pageTitle}>
              {FILTROS.find(f => f.key === filtro)?.label || 'Misiones'}
            </h2>
            <span className={styles.pageCount}>
              {tareasFiltradas.length} misión{tareasFiltradas.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className={styles.searchInput}
              />
              {busqueda && (
                <button className={styles.searchClear} onClick={() => setBusqueda('')}>✕</button>
              )}
            </div>
            {esAdmin && (
              <button className={styles.btnNueva} onClick={() => setMostrarForm(true)}>
                <span>+</span> Nueva misión
              </button>
            )}
          </div>
        </header>

        <div className={styles.grid}>
          {dbError ? (
            <div className={styles.errorBanner}>
              ⚠️ Error al conectar con la base de datos: {dbError}
            </div>
          ) : cargandoTareas ? (
            <div className={styles.empty}>
              <p style={{ color: 'var(--text-muted)' }}>Cargando misiones...</p>
            </div>
          ) : tareasFiltradas.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                {busqueda ? '🔍' : filtro === 'expirada' ? '✓' : '📋'}
              </div>
              <p>
                {busqueda
                  ? `Sin resultados para "${busqueda}"`
                  : filtro === 'todas'
                  ? esAdmin
                    ? 'No hay misiones aún. ¡Crea la primera!'
                    : 'No hay misiones publicadas todavía.'
                  : `No hay misiones en "${FILTROS.find(f => f.key === filtro)?.label}".`
                }
              </p>
              {esAdmin && filtro === 'todas' && !busqueda && (
                <button className={styles.btnNueva} onClick={() => setMostrarForm(true)}>
                  + Agregar misión
                </button>
              )}
            </div>
          ) : (
            tareasFiltradas.map(tarea => (
              <TareaCard
                key={tarea.id}
                tarea={tarea}
                esAdmin={esAdmin}
                onEliminar={eliminarTarea}
                onEditar={setTareaEditando}
              />
            ))
          )}
        </div>
          </>
        )}
      </main>

      {/* Modal: login */}
      {mostrarLogin && !esAdmin && (
        <LoginAdmin
          onLogin={handleLogin}
          error={errorAuth}
          onLimpiarError={limpiarError}
          onCancelar={() => { setMostrarLogin(false); limpiarError() }}
        />
      )}

      {/* Modal: nueva tarea */}
      {esAdmin && mostrarForm && (
        <FormularioTarea
          onAgregar={handleAgregar}
          onCancelar={() => setMostrarForm(false)}
        />
      )}

      {/* Modal: editar tarea */}
      {esAdmin && tareaEditando && (
        <FormularioTarea
          tareaInicial={tareaEditando}
          onAgregar={handleGuardarEdicion}
          onCancelar={() => setTareaEditando(null)}
        />
      )}
    </div>
  )
}
