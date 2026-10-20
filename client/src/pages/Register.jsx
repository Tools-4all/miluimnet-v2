// עמוד הרשמה - יוצר משתמש חדש (Create של מודל המשתמשים)
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const EMPTY_FORM = { username: '', displayName: '', password: '', password2: '', unit: '', city: '' }

// בדיקות תקינות בצד הלקוח. מחזיר הודעת שגיאה, או מחרוזת ריקה אם הכל תקין
function validate(form) {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
    return 'שם משתמש: 3-20 תווים, אותיות באנגלית, מספרים וקו תחתון'
  }
  if (form.displayName.trim().length < 2) return 'צריך למלא שם מלא'
  if (form.password.length < 6) return 'הסיסמה חייבת להכיל לפחות 6 תווים'
  if (form.password !== form.password2) return 'הסיסמאות לא זהות'
  return ''
}

function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (user) return <Navigate to="/" replace />

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const problem = validate(form)
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError('')
    try {
      // password2 רק לבדיקה בצד הלקוח - לא נשלח לשרת
      const { password2: _password2, ...details } = form
      await register(details)
      navigate('/')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="panel form" onSubmit={handleSubmit}>
        <h1>הרשמה למילואימנט</h1>
        <div className="form-row">
          <label>
            שם משתמש (באנגלית)
            <input name="username" value={form.username} onChange={handleChange} autoComplete="username" />
          </label>
          <label>
            שם מלא
            <input name="displayName" value={form.displayName} onChange={handleChange} />
          </label>
        </div>
        <div className="form-row">
          <label>
            סיסמה
            <input type="password" name="password" value={form.password} onChange={handleChange} autoComplete="new-password" />
          </label>
          <label>
            אימות סיסמה
            <input type="password" name="password2" value={form.password2} onChange={handleChange} autoComplete="new-password" />
          </label>
        </div>
        <div className="form-row">
          <label>
            יחידה (לא חובה)
            <input name="unit" value={form.unit} onChange={handleChange} placeholder="לדוגמה: גדוד 8101" />
          </label>
          <label>
            עיר (לא חובה)
            <input name="city" value={form.city} onChange={handleChange} />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="button-large" disabled={saving}>
          {saving ? 'נרשם...' : 'הרשמה'}
        </button>
        <p className="card-meta">
          כבר רשום? <Link to="/login">להתחברות</Link>
        </p>
      </form>
    </div>
  )
}

export default Register
