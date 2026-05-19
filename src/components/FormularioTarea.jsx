import { useState } from 'react'
import styles from './FormularioTarea.module.css'

const MATERIAS = [
  'Científico', 'Vida en Sociedad', 'Cuerpo', 'Arte', 'WorldView', 'Exploración',
]

const hoy = () => new Date().toISOString().split('T')[0]

export default function FormularioTarea({ onAgregar, onCancelar, tareaInicial }) {
  const [form, setForm] = useState({
    titulo: tareaInicial?.titulo || '',
    descripcion: tareaInicial?.descripcion || '',
    materia: tareaInicial?.materia || MATERIAS[0],
    fechaVencimiento: tareaInicial?.fechaVencimiento
      ? new Date(tareaInicial.fechaVencimiento).toISOString().split('T')[0]
      : '',
  })
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo.trim()) return setError('El título es obligatorio.')
    if (!form.fechaVencimiento) return setError('La fecha de entrega es obligatoria.')
    if (form.fechaVencimiento < hoy()) return setError('La fecha no puede ser en el pasado.')
    onAgregar(form)
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancelar()}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <span className={styles.badge}>ADMIN</span>
          <h2>{tareaInicial ? 'Editar misión' : 'Nueva misión'}</h2>
          <button className={styles.cerrar} onClick={onCancelar} aria-label="Cerrar">✕</button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="titulo">Título</label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              placeholder="Ej. Resolver ejercicios pág. 45"
              value={form.titulo}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="descripcion">Descripción <span className={styles.opcional}>(opcional)</span></label>
            <textarea
              id="descripcion"
              name="descripcion"
              placeholder="Instrucciones adicionales..."
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="materia">Materia</label>
              <select id="materia" name="materia" value={form.materia} onChange={handleChange}>
                {MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="fechaVencimiento">Fecha de entrega</label>
              <input
                id="fechaVencimiento"
                name="fechaVencimiento"
                type="date"
                min={hoy()}
                value={form.fechaVencimiento}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.note}>
            ⏳ La misión expirará automáticamente <strong>5 días</strong> después de la fecha de entrega.
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.btnSecundario} onClick={onCancelar}>Cancelar</button>
            <button type="submit" className={styles.btnPrimario}>
              {tareaInicial ? 'Guardar cambios' : 'Crear misión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
