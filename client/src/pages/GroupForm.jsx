// טופס קבוצה - משמש גם ליצירה (/groups/new) וגם לעריכה (/groups/:id/edit)
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createGroup, getGroup, updateGroup } from '../api/groups.js'
import { useMeta } from '../hooks/useMeta.js'
import Loading from '../components/ui/Loading.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { notify } from '../utils/notify.js'

const EMPTY_FORM = { name: '', description: '', unitType: '', region: '', privacy: 'public' }

function GroupForm() {
  const { id } = useParams()
  const isEdit = Boolean(id) // יש id בכתובת = עריכה
  const navigate = useNavigate()
  const { unitTypes, regions } = useMeta()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('') // הקבוצה לא נטענה / אין הרשאה - לא מציגים טופס
  const [error, setError] = useState('') // שגיאה בשמירה - מוצגת מתחת לטופס
  const [saving, setSaving] = useState(false)

  // בעריכה - ממלאים את הטופס בפרטים הקיימים
  useEffect(() => {
    if (!isEdit) return
    getGroup(id)
      .then((g) => {
        if (!g.isAdmin) setLoadError('רק מנהל הקבוצה יכול לערוך אותה')
        else setForm({ name: g.name, description: g.description, unitType: g.unitType, region: g.region, privacy: g.privacy })
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    // בדיקות בצד הלקוח - חוסכות פנייה לשרת. השרת בודק שוב בכל מקרה
    if (form.name.trim().length < 3) return setError('שם הקבוצה חייב להכיל לפחות 3 תווים')
    if (!form.unitType || !form.region) return setError('חובה לבחור סוג יחידה ואזור')

    setSaving(true)
    setError('')
    try {
      const group = isEdit ? await updateGroup(id, form) : await createGroup(form)
      notify(isEdit ? 'הקבוצה עודכנה' : 'הקבוצה נוצרה')
      navigate(`/groups/${group._id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <Loading />
  if (loadError) return <EmptyState text={loadError} />

  return (
    <div className="narrow">
      <div className="page-header">
        <h1>{isEdit ? 'עריכת קבוצה' : 'קבוצה חדשה'}</h1>
        {!isEdit && <p>מי שיוצר את הקבוצה הופך למנהל שלה.</p>}
      </div>

      <form className="panel form" onSubmit={handleSubmit}>
        <label>
          שם הקבוצה
          <input name="name" maxLength={50} value={form.name} onChange={handleChange} placeholder="לדוגמה: גדוד 8101 - פלוגה ב" />
        </label>
        <label>
          תיאור
          <textarea name="description" rows={5} maxLength={1000} value={form.description} onChange={handleChange} />
        </label>
        <div className="form-row">
          <label>
            סוג יחידה
            <select name="unitType" value={form.unitType} onChange={handleChange}>
              <option value="">בחרו...</option>
              {unitTypes.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          <label>
            אזור
            <select name="region" value={form.region} onChange={handleChange}>
              <option value="">בחרו...</option>
              {regions.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          פרטיות
          <select name="privacy" value={form.privacy} onChange={handleChange}>
            <option value="public">ציבורית - כל אחד יכול להצטרף</option>
            <option value="private">פרטית - הצטרפות באישור המנהל</option>
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <div className="form-footer">
          <button type="submit" className="button-large" disabled={saving}>
            {saving ? 'שומר...' : isEdit ? 'שמירת השינויים' : 'יצירת הקבוצה'}
          </button>
          <button type="button" className="button-secondary" onClick={() => navigate(-1)}>
            ביטול
          </button>
        </div>
      </form>
    </div>
  )
}

export default GroupForm
