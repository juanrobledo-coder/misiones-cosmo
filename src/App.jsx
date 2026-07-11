import { useState } from 'react'
import { Layers, CircleCheck, CalendarDays, Clock, XCircle, Archive, BookOpen, Search } from 'lucide-react'
import { useTareas } from './useTareas'
import { useAuth } from './useAuth'
import { useTema } from './useTema'
import { supabaseConfigurado } from './supabase'
import FormularioTarea from './components/FormularioTarea'
import TareaCard from './components/TareaCard'
import LoginAdmin from './components/LoginAdmin'
import PantallaSetup from './components/PantallaSetup'
import styles from './App.module.css'

const FILTROS = [
  { key: 'todas',     label: 'Todas',       Icono: Layers },
  { key: 'pendiente', label: 'A tiempo',     Icono: CircleCheck },
  { key: 'proxima',   label: 'Esta semana',  Icono: CalendarDays },
  { key: 'hoy',       label: 'Para hoy',     Icono: Clock },
  { key: 'vencida',   label: 'Atrasadas',    Icono: XCircle },
  { key: 'expirada',  label: 'Archivadas',   Icono: Archive },
]

export default function App() {
  if (!supabaseConfigurado) return <PantallaSetup />
  return <AppInterna />
}

function AppInterna() {
  const { tareas, contadores, cargando: cargandoTareas, dbError, agregarTarea, eliminarTarea, editarTarea, limpiarExpiradas } = useTareas()
  const { esAdmin, cargando: cargandoAuth, error: errorAuth, iniciarSesion, cerrarSesion, limpiarError } = useAuth()
  const { tema, alternarTema } = useTema()

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

  // On mobile, show login as a full replacement page — no content bleeding through
  if (mostrarLogin && !esAdmin) {
    return (
      <LoginAdmin
        onLogin={handleLogin}
        error={errorAuth}
        onLimpiarError={limpiarError}
        onCancelar={() => { setMostrarLogin(false); limpiarError() }}
      />
    )
  }

  return (
    <div className={styles.layout}>

      {/* ── MOBILE TOP BAR ── */}
      <div className={styles.mobileTopBar}>
        <div className={styles.mobileLogo}>
          <span className={styles.mobileLogoIcon}>✦</span>
          <span className={styles.mobileLogoTitle}>Misiones</span>
        </div>
        {esAdmin ? (
          <button className={`${styles.mobileAdminBtn} ${styles.active}`} onClick={cerrarSesion}>
            <span className={styles.mobileAdminDot} />
            Cerrar sesión
          </button>
        ) : (
          <button className={styles.mobileAdminBtn} onClick={() => setMostrarLogin(true)}>
            Acceso admin
          </button>
        )}
      </div>

      {/* ── DESKTOP SIDEBAR ── */}
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
                  <span className={styles.navIcono}><f.Icono size={14} strokeWidth={2.25} /></span>
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
              <span className={styles.navIcono}><BookOpen size={14} strokeWidth={2.25} /></span>
              Bitácora
            </span>
          </button>
        </nav>

        {esAdmin && numExpiradas > 0 && (
          <button className={styles.limpiarBtn} onClick={limpiarExpiradas}>
            🗑 Limpiar {numExpiradas} archivada{numExpiradas !== 1 ? 's' : ''}
          </button>
        )}

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
          <button className={styles.temaBtn} onClick={alternarTema}>
            <span className={styles.temaIcon}>{tema === 'dark' ? '☀' : '☾'}</span>
            {tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>

        {/* Hero */}
        <div className={styles.hero}>
          <span className={styles.heroSupra}>bitácora viajera</span>
          <h1 className={styles.heroTitle}>Misiones</h1>
        </div>

        {/* Mobile filter chips — always visible so "Bitácora" stays reachable to toggle back */}
        <div className={styles.mobileFilters}>
          {FILTROS.map(f => {
            const count = f.key === 'todas' ? tareas.length : (contadores[f.key] || 0)
            return (
              <button
                key={f.key}
                className={`${styles.mobileChip} ${vista === 'misiones' && filtro === f.key ? styles.chipActive : ''}`}
                onClick={() => { setVista('misiones'); setFiltro(f.key) }}
              >
                <f.Icono size={13} strokeWidth={2.25} />
                {f.label}
                {count > 0 && <span className={styles.mobileChipCount}>{count}</span>}
              </button>
            )
          })}
          <button
            className={`${styles.mobileChip} ${vista === 'bitacora' ? styles.chipActive : ''}`}
            onClick={() => setVista(v => v === 'bitacora' ? 'misiones' : 'bitacora')}
          >
            <BookOpen size={13} strokeWidth={2.25} />
            Bitácora
          </button>
        </div>

        {vista === 'bitacora' ? (
          <div className={styles.bitacoraPlaceholder}>
            <div className={styles.bitacoraIcon}>🗺</div>
            <h2>Bitácora Viajera</h2>
            <p>Esta sección estará disponible pronto.</p>
          </div>
        ) : (
          <>
            {/* Topbar (search + desktop + button) */}
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
                  <Search size={14} strokeWidth={2.25} className={styles.searchIcon} />
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

            {/* Cards grid */}
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

            {/* Mobile FAB — nueva misión (admin) */}
            {esAdmin && (
              <button className={styles.fab} onClick={() => setMostrarForm(true)}>
                <span className={styles.fabIcon}>+</span>
              </button>
            )}
          </>
        )}

        {/* Mobile FAB — tema (siempre visible, izquierda) */}
        <button className={styles.fabTema} onClick={alternarTema} aria-label="Cambiar tema">
          <span className={styles.fabIcon}>{tema === 'dark' ? '☀' : '☾'}</span>
        </button>
      </main>

      {/* Modal: nueva misión */}
      {esAdmin && mostrarForm && (
        <FormularioTarea
          onAgregar={handleAgregar}
          onCancelar={() => setMostrarForm(false)}
        />
      )}

      {/* Modal: editar misión */}
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
