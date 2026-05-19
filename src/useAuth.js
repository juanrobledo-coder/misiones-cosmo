import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseConfigurado } from './supabase'

export function useAuth() {
  const [esAdmin, setEsAdmin]   = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!supabaseConfigurado) { setCargando(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setEsAdmin(!!session)
      setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setEsAdmin(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const iniciarSesion = useCallback(async (email, contrasena) => {
    if (!supabaseConfigurado) return false
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password: contrasena })
    if (err) { setError('Correo o contraseña incorrectos.'); return false }
    return true
  }, [])

  const cerrarSesion = useCallback(async () => {
    if (!supabaseConfigurado) return
    await supabase.auth.signOut()
  }, [])

  const limpiarError = useCallback(() => setError(''), [])

  return { esAdmin, cargando, error, iniciarSesion, cerrarSesion, limpiarError }
}
