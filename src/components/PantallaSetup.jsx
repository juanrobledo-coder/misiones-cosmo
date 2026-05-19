import styles from './PantallaSetup.module.css'

export default function PantallaSetup() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>⚙️</div>
        <h1 className={styles.titulo}>Configuración requerida</h1>
        <p className={styles.sub}>
          Falta conectar Supabase. Crea un archivo <code>.env.local</code> en la raíz del proyecto con estas dos variables:
        </p>

        <div className={styles.codeBlock}>
          <div className={styles.codeLine}>
            <span className={styles.codeKey}>VITE_SUPABASE_URL</span>
            <span className={styles.codeVal}>=https://xxxx.supabase.co</span>
          </div>
          <div className={styles.codeLine}>
            <span className={styles.codeKey}>VITE_SUPABASE_ANON_KEY</span>
            <span className={styles.codeVal}>=eyJhbGci...</span>
          </div>
        </div>

        <ol className={styles.pasos}>
          <li>Ve a <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a> y crea un proyecto gratuito</li>
          <li>En el panel: <strong>Project Settings → API</strong></li>
          <li>Copia la <strong>Project URL</strong> y la <strong>anon key</strong></li>
          <li>Pégalas en <code>.env.local</code> y reinicia el servidor (<code>npm run dev</code>)</li>
        </ol>

        <a
          className={styles.btnDocs}
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
        >
          Abrir Supabase Dashboard →
        </a>

        <p className={styles.nota}>
          Consulta <code>DEPLOYMENT.md</code> en el proyecto para la guía completa, incluyendo cómo crear la tabla y el usuario admin.
        </p>
      </div>
    </div>
  )
}
