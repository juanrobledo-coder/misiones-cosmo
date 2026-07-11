import { useState, useEffect, useCallback } from 'react'

const CLAVE = 'tema'

function temaInicial() {
  const guardado = localStorage.getItem(CLAVE)
  if (guardado === 'dark' || guardado === 'light') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTema() {
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem(CLAVE, tema)
  }, [tema])

  const alternarTema = useCallback(() => {
    setTema(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { tema, alternarTema }
}
