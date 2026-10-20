// עמוד התחברות עם שם משתמש וסיסמה
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // מי שכבר מחובר לא צריך את העמוד הזה
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    // בדיקה בצד הלקוח - לפני שבכלל שולחים לשרת
    if (!username.trim() || !password) {
      setError('צריך למלא שם משתמש וסיסמה')
      return
    }
    setSaving(true)
    setError('')
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message) // ההודעה שהשרת החזיר, למשל "שם משתמש או סיסמה שגויים"
      setSaving(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="panel form" onSubmit={handleSubmit}>
        <h1>התחברות</h1>
        <label>
          שם משתמש
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label>
          סיסמה
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="button-large" disabled={saving}>
          {saving ? 'מתחבר...' : 'התחברות'}
        </button>
        <p className="card-meta">
          אין לך חשבון? <Link to="/register">להרשמה</Link>
        </p>
      </form>
    </div>
  )
}

export default Login
