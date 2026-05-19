import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const DIAS_EXPIRACION = 5

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
    fechaCreacion:    row.fecha_creacion,
    fechaVencimiento: row.fecha_vencimiento,
    estado:           calcularEstado(row),
  }
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

  // Real-time: all students see changes the instant admin saves
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

  const agregarTarea = useCallback(async ({ titulo, descripcion, materia, fechaVencimiento }) => {
    const { error } = await supabase.from('misiones').insert({
      titulo, descripcion, materia,
      fecha_vencimiento: new Date(fechaVencimiento + 'T23:59:59').toISOString(),
    })
    if (error) throw error
  }, [])

  const eliminarTarea = useCallback(async (id) => {
    const { error } = await supabase.from('misiones').delete().eq('id', id)
    if (error) throw error
  }, [])

  const editarTarea = useCallback(async (id, campos) => {
    const update = {}
    if (campos.titulo)                    update.titulo = campos.titulo
    if (campos.descripcion !== undefined) update.descripcion = campos.descripcion
    if (campos.materia)                   update.materia = campos.materia
    if (campos.fechaVencimiento)          update.fecha_vencimiento = new Date(campos.fechaVencimiento + 'T23:59:59').toISOString()
    const { error } = await supabase.from('misiones').update(update).eq('id', id)
    if (error) throw error
  }, [])

  const limpiarExpiradas = useCallback(async () => {
    const limite = new Date()
    limite.setDate(limite.getDate() - DIAS_EXPIRACION)
    const { error } = await supabase
      .from('misiones').delete()
      .lt('fecha_vencimiento', limite.toISOString())
    if (error) throw error
  }, [])

  const contadores = tareas.reduce((acc, t) => {
    acc[t.estado] = (acc[t.estado] || 0) + 1
    return acc
  }, {})

  return { tareas, contadores, cargando, dbError, agregarTarea, eliminarTarea, editarTarea, limpiarExpiradas, DIAS_EXPIRACION }
}
