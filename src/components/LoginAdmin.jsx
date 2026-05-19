import { useState } from 'react'
import styles from './LoginAdmin.module.css'

export default function LoginAdmin({ onLogin, error, onLimpiarError }) {
  const [email, setEmail]           = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarPass, setMostrarPass] = useState(false)
  const [enviando, setEnviando]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    await onLogin(email.trim(), contrasena)
    setEnviando(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>✦</div>
        <h1 className={styles.titulo}>Acceso Admin</h1>
        <p className={styles.sub}>Solo el administrador puede gestionar las misiones.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@cosmo.edu.co"
              value={email}
              onChange={e => { setEmail(e.target.value); onLimpiarError() }}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="contrasena">Contraseña</label>
            <div className={styles.passWrap}>
              <input
                id="contrasena"
                type={mostrarPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={contrasena}
                onChange={e => { setContrasena(e.target.value); onLimpiarError() }}
              />
              <button
                type="button"
                className={styles.togglePass}
                onClick={() => setMostrarPass(v => !v)}
                tabIndex={-1}
              >
                {mostrarPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btnLogin} disabled={enviando}>
            {enviando ? 'Verificando...' : 'Entrar como admin'}
          </button>
        </form>

        <p className={styles.hint}>Los estudiantes no necesitan iniciar sesión.</p>
      </div>
    </div>
  )
}
