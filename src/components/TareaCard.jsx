import { useState } from 'react'
import styles from './TareaCard.module.css'

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'ok' },
  proxima:   { label: 'Próxima',   color: 'warn' },
  hoy:       { label: 'Hoy',       color: 'danger', pulse: true },
  vencida:   { label: 'Vencida',   color: 'danger' },
  expirada:  { label: 'Expirada',  color: 'expired' },
}

function formatFecha(iso, formato = 'corto') {
  const d = new Date(iso)
  if (formato === 'corto') {
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function diasRestantes(isoVencimiento) {
  const ahora = new Date()
  ahora.setHours(0,0,0,0)
  const venc = new Date(isoVencimiento)
  venc.setHours(0,0,0,0)
  return Math.round((venc - ahora) / (1000 * 60 * 60 * 24))
}

function textoRestante(tarea) {
  if (tarea.estado === 'expirada') return 'Expirada'
  const d = diasRestantes(tarea.fechaVencimiento)
  if (d < 0) return `Venció hace ${Math.abs(d)} día${Math.abs(d) !== 1 ? 's' : ''}`
  if (d === 0) return 'Vence hoy'
  if (d === 1) return 'Vence mañana'
  return `${d} días restantes`
}

export default function TareaCard({ tarea, onEliminar, onEditar, esAdmin = false }) {
  const [confirmando, setConfirmando] = useState(false)
  const cfg = ESTADO_CONFIG[tarea.estado] || ESTADO_CONFIG.pendiente
  const esExpirada = tarea.estado === 'expirada'

  const fechaExp = new Date(tarea.fechaVencimiento)
  fechaExp.setDate(fechaExp.getDate() + 5)

  return (
    <article className={`${styles.card} ${styles[tarea.estado]} fade-in`}>
      <div className={styles.topRow}>
        <span className={`${styles.estadoBadge} ${styles[`badge_${cfg.color}`]} ${cfg.pulse ? styles.pulse : ''}`}>
          {cfg.label}
        </span>
        <span className={styles.materia}>{tarea.materia}</span>
        {esAdmin && (
          <div className={styles.acciones}>
            {!esExpirada && (
              <button className={styles.btnEdit} onClick={() => onEditar(tarea)} title="Editar">
                ✎
              </button>
            )}
            {!confirmando ? (
              <button className={styles.btnDel} onClick={() => setConfirmando(true)} title="Eliminar">
                ✕
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

      {tarea.descripcion && (
        <p className={styles.desc}>{tarea.descripcion}</p>
      )}

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
  )
}

function getProgreso(tarea) {
  const creada = new Date(tarea.fechaCreacion)
  const vence = new Date(tarea.fechaVencimiento)
  const ahora = new Date()
  const total = vence - creada
  const transcurrido = ahora - creada
  return (transcurrido / total) * 100
}
