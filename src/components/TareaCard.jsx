import { useState, useRef, useLayoutEffect } from 'react'
import { Pencil, X, ZoomIn } from 'lucide-react'
import styles from './TareaCard.module.css'

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'ok' },
  proxima:   { label: 'Próxima',   color: 'warn' },
  hoy:       { label: 'Hoy',       color: 'danger', pulse: true },
  vencida:   { label: 'Vencida',   color: 'danger' },
  expirada:  { label: 'Expirada',  color: 'expired' },
}

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function diasRestantes(isoVencimiento) {
  const ahora = new Date(); ahora.setHours(0,0,0,0)
  const venc  = new Date(isoVencimiento); venc.setHours(0,0,0,0)
  return Math.round((venc - ahora) / (1000 * 60 * 60 * 24))
}

function textoRestante(tarea) {
  if (tarea.estado === 'expirada') return 'Expirada'
  const d = diasRestantes(tarea.fechaVencimiento)
  if (d < 0)  return `Venció hace ${Math.abs(d)} día${Math.abs(d) !== 1 ? 's' : ''}`
  if (d === 0) return 'Vence hoy'
  if (d === 1) return 'Vence mañana'
  return `${d} días restantes`
}

function getProgreso(tarea) {
  const creada = new Date(tarea.fechaCreacion)
  const vence  = new Date(tarea.fechaVencimiento)
  const ahora  = new Date()
  const total  = vence - creada
  if (total <= 0) return 100
  return ((ahora - creada) / total) * 100
}

export default function TareaCard({ tarea, onEliminar, onEditar, esAdmin = false }) {
  const [confirmando, setConfirmando] = useState(false)
  const [lightbox, setLightbox]       = useState(false)
  const [detalle, setDetalle]         = useState(false)
  const [descTruncada, setDescTruncada] = useState(false)
  const descRef = useRef(null)

  const cfg        = ESTADO_CONFIG[tarea.estado] || ESTADO_CONFIG.pendiente
  const esExpirada = tarea.estado === 'expirada'

  const fechaExp = new Date(tarea.fechaVencimiento)
  fechaExp.setDate(fechaExp.getDate() + 5)

  // Detect whether the description is actually being clipped by the line-clamp,
  // regardless of card width — so "Ver más" only shows up when it's needed.
  useLayoutEffect(() => {
    const el = descRef.current
    if (!el) { setDescTruncada(false); return }
    const medir = () => setDescTruncada(el.scrollHeight > el.clientHeight + 1)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [tarea.descripcion])

  const metaGrid = (
    <div className={styles.metaGrid}>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Creada</span>
        <span className={styles.metaVal}>{formatFecha(tarea.fechaCreacion)}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Entrega</span>
        <span className={styles.metaVal}>{formatFecha(tarea.fechaVencimiento)}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Expira</span>
        <span className={styles.metaVal}>{formatFecha(fechaExp.toISOString())}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Estado</span>
        <span className={`${styles.metaVal} ${styles[`color_${cfg.color}`]}`}>{textoRestante(tarea)}</span>
      </div>
    </div>
  )

  return (
    <>
      <article className={`${styles.card} ${styles[tarea.estado]} fade-in`}>

        {/* Image banner */}
        {tarea.imagenUrl && (
          <button
            type="button"
            className={styles.imagenWrap}
            onClick={() => setLightbox(true)}
            aria-label={`Ver imagen de "${tarea.titulo}" en tamaño completo`}
          >
            <img src={tarea.imagenUrl} alt="" className={styles.imagen} />
            <div className={styles.imagenOverlay}>
              <ZoomIn size={18} strokeWidth={2} />
            </div>
          </button>
        )}

        <div className={styles.topRow}>
          <span className={`${styles.estadoBadge} ${styles[`badge_${cfg.color}`]} ${cfg.pulse ? styles.pulse : ''}`}>
            {cfg.label}
          </span>
          <span className={styles.materia}>{tarea.materia}</span>
          {esAdmin && (
            <div className={styles.acciones}>
              {!esExpirada && (
                <button className={styles.btnEdit} onClick={() => onEditar(tarea)} title="Editar" aria-label="Editar misión">
                  <Pencil size={13} strokeWidth={2.25} />
                </button>
              )}
              {!confirmando ? (
                <button className={styles.btnDel} onClick={() => setConfirmando(true)} title="Eliminar" aria-label="Eliminar misión">
                  <X size={13} strokeWidth={2.5} />
                </button>
              ) : (
                <span className={styles.confirm}>
                  <button className={styles.btnConfirm} onClick={() => onEliminar(tarea.id)}>Sí, borrar</button>
                  <button className={styles.btnCancel} onClick={() => setConfirmando(false)}>No</button>
                </span>
              )}
            </div>
          )}
        </div>

        <h3 className={`${styles.tituloWrap} ${esExpirada ? styles.tachado : ''}`}>
          <button
            type="button"
            className={styles.titulo}
            onClick={() => setDetalle(true)}
            title={tarea.titulo}
          >
            {tarea.titulo}
          </button>
        </h3>

        <div className={styles.descArea}>
          {tarea.descripcion && (
            <p ref={descRef} className={styles.desc}>{tarea.descripcion}</p>
          )}
          {descTruncada && (
            <button className={styles.verMas} onClick={() => setDetalle(true)}>
              Ver más
            </button>
          )}
        </div>

        {metaGrid}

        {!esExpirada && (
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.max(0, Math.min(100, getProgreso(tarea)))}%` }}
              data-estado={tarea.estado}
            />
          </div>
        )}
      </article>

      {/* Lightbox: image only */}
      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(false)}>
          <button className={styles.lightboxCerrar} onClick={() => setLightbox(false)} aria-label="Cerrar imagen">
            <X size={20} strokeWidth={2.5} />
          </button>
          <img
            src={tarea.imagenUrl}
            alt={tarea.titulo}
            className={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Detail modal: full title + full description */}
      {detalle && (
        <div className={styles.detalleOverlay} onClick={() => setDetalle(false)}>
          <div className={styles.detalleCard} onClick={e => e.stopPropagation()}>
            <button className={styles.detalleCerrar} onClick={() => setDetalle(false)} aria-label="Cerrar detalle">
              <X size={16} strokeWidth={2.5} />
            </button>
            {tarea.imagenUrl && (
              <img src={tarea.imagenUrl} alt="" className={styles.detalleImg} />
            )}
            <div className={styles.detalleBody}>
              <span className={`${styles.estadoBadge} ${styles[`badge_${cfg.color}`]}`}>
                {cfg.label}
              </span>
              <h3 className={styles.detalleTitulo}>{tarea.titulo}</h3>
              {tarea.descripcion && (
                <p className={styles.detalleDesc}>{tarea.descripcion}</p>
              )}
              {metaGrid}
            </div>
          </div>
        </div>
      )}
    </>
  )
}