import { useState } from 'react'
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
  return ((ahora - creada) / (vence - creada)) * 100
}

export default function TareaCard({ tarea, onEliminar, onEditar, esAdmin = false }) {
  const [confirmando, setConfirmando] = useState(false)
  const [lightbox, setLightbox]       = useState(false)
  const cfg        = ESTADO_CONFIG[tarea.estado] || ESTADO_CONFIG.pendiente
  const esExpirada = tarea.estado === 'expirada'

  const fechaExp = new Date(tarea.fechaVencimiento)
  fechaExp.setDate(fechaExp.getDate() + 5)

  return (
    <>
      <article className={`${styles.card} ${styles[tarea.estado]} fade-in`}>

        {/* Image banner */}
        {tarea.imagenUrl && (
          <div className={styles.imagenWrap} onClick={() => setLightbox(true)}>
            <img src={tarea.imagenUrl} alt="" className={styles.imagen} />
            <div className={styles.imagenOverlay}>
              <ZoomIn size={18} strokeWidth={2} />
            </div>
          </div>
        )}

        <div className={styles.topRow}>
          <span className={`${styles.estadoBadge} ${styles[`badge_${cfg.color}`]} ${cfg.pulse ? styles.pulse : ''}`}>
            {cfg.label}
          </span>
          <span className={styles.materia}>{tarea.materia}</span>
          {esAdmin && (
            <div className={styles.acciones}>
              {!esExpirada && (
                <button className={styles.btnEdit} onClick={() => onEditar(tarea)} title="Editar">
                  <Pencil size={13} strokeWidth={2.25} />
                </button>
              )}
              {!confirmando ? (
                <button className={styles.btnDel} onClick={() => setConfirmando(true)} title="Eliminar">
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

        <h3 className={`${styles.titulo} ${esExpirada ? styles.tachado : ''}`}>{tarea.titulo}</h3>

        {tarea.descripcion && <p className={styles.desc}>{tarea.descripcion}</p>}

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

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(false)}>
          <button className={styles.lightboxCerrar} onClick={() => setLightbox(false)}>
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
    </>
  )
}