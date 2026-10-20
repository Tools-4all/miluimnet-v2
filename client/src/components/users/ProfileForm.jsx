// טופס עריכת הפרופיל שלי. מקבל את הפרופיל הנוכחי, ומחזיר את המשתמש המעודכן דרך onSaved
import { useState } from 'react'
import { updateMyProfile } from '../../api/users.js'
import { resizeImage } from '../../utils/resizeImage.js'
import { notify } from '../../utils/notify.js'

function ProfileForm({ profile, onSaved, onCancel }) {
  // כל השדות באובייקט state אחד. כל שינוי מעתיק את האובייקט ומחליף שדה אחד
  const [form, setForm] = useState({
    displayName: profile.displayName,
    unit: profile.unit,
    city: profile.city,
    bio: profile.bio,
    avatar: profile.avatar,
  })
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // תמונת פרופיל: מקטינים ל-256 פיקסלים בעזרת Canvas לפני השליחה לשרת
  async function handleAvatar(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      notify('אפשר להעלות רק תמונה', 'error')
      return
    }
    setForm({ ...form, avatar: await resizeImage(file, 256) })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    // בדיקה בצד הלקוח. השרת בודק שוב - כי אפשר לעקוף את הלקוח
    if (form.displayName.trim().length < 2) {
      notify('צריך למלא שם מלא', 'error')
      return
    }
    setSaving(true)
    try {
      const updated = await updateMyProfile(form)
      notify('הפרופיל נשמר')
      onSaved(updated)
    } catch (err) {
      notify(err.message, 'error')
    }
    setSaving(false)
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <h2>עריכת הפרופיל</h2>
      <div className="form-row">
        <label>
          שם מלא
          <input name="displayName" value={form.displayName} onChange={handleChange} maxLength={40} />
        </label>
        <label>
          יחידה
          <input name="unit" value={form.unit} onChange={handleChange} maxLength={60} />
        </label>
      </div>
      <div className="form-row">
        <label>
          עיר
          <input name="city" value={form.city} onChange={handleChange} maxLength={40} />
        </label>
        <label>
          תמונת פרופיל
          <input type="file" accept="image/*" onChange={handleAvatar} className="file-input" />
        </label>
      </div>
      <label>
        קצת עליי
        <textarea name="bio" rows={3} maxLength={300} value={form.bio} onChange={handleChange} />
      </label>
      <div className="form-footer">
        <button type="submit" disabled={saving}>
          {saving ? 'שומר...' : 'שמירה'}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  )
}

export default ProfileForm
