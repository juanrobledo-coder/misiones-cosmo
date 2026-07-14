import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const DIAS_EXPIRACION = 5
const BUCKET = 'misiones-imagenes'

export function calcularEstado(tarea) {
  const ahora = new Date()
  const fechaVencimiento = new Date(tarea.fecha_vencimiento)
  const fechaExpiracion = new Date(fechaVencimiento)
  fechaExpiracion.setDate(fechaExpiracion.getDate() + DIAS_EXPIRACION)

  if (ahora > fechaExpiracion) return 'expirada'

  const diffMs = fechaVencimiento - ahora
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDias < 0) return 'vencida'
  if (diffDias === 0) return 'hoy'
  if (diffDias <= 2) return 'proxima'
  return 'pendiente'
}

function mapear(row) {
  return {
    id:               row.id,
    titulo:           row.titulo,
    descripcion:      row.descripcion || '',
    materia:          row.materia,
    imagenUrl:        row.imagen_url || null,
    fechaCreacion:    row.fecha_creacion,
    fechaVencimiento: row.fecha_vencimiento,
    estado:           calcularEstado(row),
  }
}

async function subirImagen(archivo) {
  const ext = archivo.name.split('.').pop()
  const nombre = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(nombre, archivo, {
    cacheControl: '3600',
    upsert: false,
    contentType: archivo.type,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombre)
  return data.publicUrl
}

async function borrarImagen(url) {
  if (!url) return
  // Extract filename from full URL
  const nombre = url.split('/').pop()
  await supabase.storage.from(BUCKET).remove([nombre])
}

export function useTareas() {
  const [tareas, setTareas]     = useState([])
  const [cargando, setCargando] = useState(true)
  const [dbError, setDbError]   = useState(null)

  useEffect(() => { cargarTareas() }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTareas(prev => prev.map(t => ({
        ...t,
        estado: calcularEstado({ fecha_vencimiento: t.fechaVencimiento })
      })))
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('misiones-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'misiones' }, () => {
        cargarTareas()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function cargarTareas() {
    setCargando(true)
    const { data, error } = await supabase
      .from('misiones')
      .select('*')
      .order('fecha_creacion', { ascending: false })

    if (error) { setDbError(error.message) }
    else { setTareas((data || []).map(mapear)); setDbError(null) }
    setCargando(false)
  }

  const agregarTarea = useCallback(async ({ titulo, descripcion, materia, fechaVencimiento, imagen }) => {
    let imagen_url = null
    if (imagen) imagen_url = await subirImagen(imagen)

    const { error } = await supabase.from('misiones').insert({
      titulo, descripcion, materia, imagen_url,
      fecha_vencimiento: new Date(fechaVencimiento + 'T23:59:59').toISOString(),
    })
    if (error) throw error
  }, [])

  const eliminarTarea = useCallback(async (id) => {
    // Delete image from storage first
    const tarea = tareas.find(t => t.id === id)
    if (tarea?.imagenUrl) await borrarImagen(tarea.imagenUrl)

    const { error } = await supabase.from('misiones').delete().eq('id', id)
    if (error) throw error
  }, [tareas])

  const editarTarea = useCallback(async (id, campos) => {
    const update = {}
    if (campos.titulo)                    update.titulo = campos.titulo
    if (campos.descripcion !== undefined) update.descripcion = campos.descripcion
    if (campos.materia)                   update.materia = campos.materia
    if (campos.fechaVencimiento)          update.fecha_vencimiento = new Date(campos.fechaVencimiento + 'T23:59:59').toISOString()

    if (campos.imagen) {
      // Upload new image, delete old one
      const tarea = tareas.find(t => t.id === id)
      if (tarea?.imagenUrl) await borrarImagen(tarea.imagenUrl)
      update.imagen_url = await subirImagen(campos.imagen)
    } else if (campos.eliminarImagen) {
      const tarea = tareas.find(t => t.id === id)
      if (tarea?.imagenUrl) await borrarImagen(tarea.imagenUrl)
      update.imagen_url = null
    }

    const { error } = await supabase.from('misiones').update(update).eq('id', id)
    if (error) throw error
  }, [tareas])

  const limpiarExpiradas = useCallback(async () => {
    // Delete images for expired missions
    const expiradas = tareas.filter(t => t.estado === 'expirada' && t.imagenUrl)
    await Promise.all(expiradas.map(t => borrarImagen(t.imagenUrl)))

    const limite = new Date()
    limite.setDate(limite.getDate() - DIAS_EXPIRACION)
    const { error } = await supabase
      .from('misiones').delete()
      .lt('fecha_vencimiento', limite.toISOString())
    if (error) throw error
  }, [tareas])

  const contadores = tareas.reduce((acc, t) => {
    acc[t.estado] = (acc[t.estado] || 0) + 1
    return acc
  }, {})

  return { tareas, contadores, cargando, dbError, agregarTarea, eliminarTarea, editarTarea, limpiarExpiradas, DIAS_EXPIRACION }
}