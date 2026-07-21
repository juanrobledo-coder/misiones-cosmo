import { useState, useRef } from 'react'
import { ImagePlus, X, Upload } from 'lucide-react'
import styles from './FormularioTarea.module.css'

const MATERIAS = [
  'Científico', 'Vida en Sociedad', 'Cuerpo', 'Arte', 'WorldView', 'Exploración',
]

const hoy = () => new Date().toISOString().split('T')[0]

// Resizes + re-encodes an image client-side before it ever reaches Supabase
// Storage — phone photos can be 4-8 MB; this gets typical uploads down to a
// few hundred KB without a visible quality hit, which matters on the free tier.
async function comprimirImagen(archivo, maxDim = 1400, calidad = 0.82) {
  const bitmap = await createImageBitmap(archivo)
  let { width, height } = bitmap
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', calidad))
  if (!blob) throw new Error('No se pudo comprimir la imagen')
  const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], nombre, { type: 'image/jpeg' })
}

export default function FormularioTarea({ onAgregar, onCancelar, tareaInicial }) {
  const [form, setForm] = useState({
    titulo:           tareaInicial?.titulo || '',
    descripcion:      tareaInicial?.descripcion || '',
    materia:          tareaInicial?.materia || MATERIAS[0],
    fechaVencimiento: tareaInicial?.fechaVencimiento
      ? new Date(tareaInicial.fechaVencimiento).toISOString().split('T')[0]
      : '',
  })
  const [error, setError]           = useState('')
  const [enviando, setEnviando]     = useState(false)
  const [comprimiendo, setComprimiendo] = useState(false)
  const [imagen, setImagen]         = useState(null)          // File object
  const [preview, setPreview]       = useState(tareaInicial?.imagenUrl || null)
  const [eliminarImg, setEliminarImg] = useState(false)
  const inputFileRef                = useRef()

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleImagen(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) return setError('Solo se permiten imágenes.')
    if (archivo.size > 8 * 1024 * 1024) return setError('La imagen no puede superar 8 MB.')
    setError('')
    setComprimiendo(true)
    try {
      const comprimida = await comprimirImagen(archivo)
      setImagen(comprimida)
      setPreview(URL.createObjectURL(comprimida))
    } catch {
      // Some formats (e.g. certain HEIC variants) can fail to decode in-browser —
      // fall back to the original file rather than blocking the upload.
      setImagen(archivo)
      setPreview(URL.createObjectURL(archivo))
    } finally {
      setEliminarImg(false)
      setComprimiendo(false)
    }
  }

  function handleQuitarImagen() {
    setImagen(null)
    setPreview(null)
    setEliminarImg(true)
    if (inputFileRef.current) inputFileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo.trim()) return setError('El título es obligatorio.')
    if (!form.fechaVencimiento) return setError('La fecha de entrega es obligatoria.')
    if (form.fechaVencimiento < hoy()) return setError('La fecha no puede ser en el pasado.')
    setEnviando(true)
    try {
      await onAgregar({ ...form, imagen, eliminarImagen: eliminarImg })
    } catch (err) {
      setError('Error al guardar. Intenta de nuevo.')
      setEnviando(false)
    }
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
            <label htmlFor="descripcion">
              Descripción <span className={styles.opcional}>(opcional)</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              placeholder="Instrucciones adicionales..."
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
            />
          </div>

          {/* Image upload */}
          <div className={styles.field}>
            <label>Imagen <span className={styles.opcional}>(opcional · se comprime automáticamente)</span></label>
            {preview ? (
              <div className={styles.previewWrap}>
                <img src={preview} alt="Vista previa" className={styles.previewImg} />
                <button
                  type="button"
                  className={styles.previewQuitar}
                  onClick={handleQuitarImagen}
                  aria-label="Quitar imagen"
                  title="Quitar imagen"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => inputFileRef.current?.click()}
                disabled={comprimiendo}
              >
                {comprimiendo ? (
                  <>
                    <Upload size={18} strokeWidth={1.75} />
                    <span>Comprimiendo imagen...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus size={18} strokeWidth={1.75} />
                    <span>Seleccionar imagen</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={inputFileRef}
              type="file"
              accept="image/*"
              onChange={handleImagen}
              style={{ display: 'none' }}
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
            <button type="button" className={styles.btnSecundario} onClick={onCancelar}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimario} disabled={enviando || comprimiendo}>
              {enviando
                ? <><Upload size={14} strokeWidth={2.5} /> Guardando...</>
                : tareaInicial ? 'Guardar cambios' : 'Crear misión'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}