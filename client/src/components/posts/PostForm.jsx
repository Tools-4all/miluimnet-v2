// טופס פוסט - משמש גם לפרסום פוסט חדש וגם לעריכה של פוסט קיים.
// props:
//   groups     - הקבוצות שאפשר לפרסם בהן (תפריט בחירה). בלי - הפוסט אישי או בקבוצה קבועה
//   fixedGroup - id של קבוצה קבועה (בעמוד של קבוצה)
//   post       - פוסט קיים לעריכה
//   onSaved    - נקרא עם הפוסט שנשמר
//   onCancel   - ביטול (בעריכה)
import { useCallback, useState } from 'react'
import { createPost, updatePost } from '../../api/posts.js'
import ImageEditor from './ImageEditor.jsx'
import { notify } from '../../utils/notify.js'

function initialForm(post, fixedGroup) {
  return {
    text: post?.text || '',
    type: post?.type || 'regular',
    price: post?.price ?? '',
    image: post?.image || '',
    videoUrl: post?.videoUrl || '',
    group: fixedGroup || '',
  }
}

// בדיקות בצד הלקוח לפני השליחה. השרת בודק שוב בכל מקרה
function validate(form) {
  if (!form.text.trim()) return 'אי אפשר לפרסם פוסט ריק'
  if (form.type === 'sale' && (form.price === '' || Number(form.price) < 0)) return 'צריך למלא מחיר (0 = למסירה)'
  if (form.videoUrl && !/^https?:\/\//.test(form.videoUrl.trim())) return 'קישור הסרטון חייב להתחיל ב-https://'
  return ''
}

function PostForm({ groups, fixedGroup, post, onSaved, onCancel }) {
  const isEdit = Boolean(post)
  const [form, setForm] = useState(() => initialForm(post, fixedGroup))
  const [showMedia, setShowMedia] = useState(Boolean(post?.image || post?.videoUrl))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // useCallback - אותה פונקציה בכל ציור, כדי ש-ImageEditor לא יצייר את התמונה שוב ושוב.
  // setForm עם פונקציה - מקבלים את ה-state העדכני ביותר
  const handleImage = useCallback((image) => setForm((prev) => ({ ...prev, image })), [])

  // הסתרת אזור המדיה גם מסירה את התמונה והסרטון - כדי שלא יתפרסמו בלי שרואים אותם
  function toggleMedia() {
    if (showMedia) setForm({ ...form, image: '', videoUrl: '' })
    setShowMedia(!showMedia)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const problem = validate(form)
    if (problem) return setError(problem)

    setSaving(true)
    setError('')
    const fields = {
      text: form.text,
      type: form.type,
      price: form.type === 'sale' ? Number(form.price) : undefined,
      image: form.image,
      videoUrl: form.videoUrl.trim(),
    }
    try {
      if (isEdit) {
        onSaved(await updatePost(post._id, fields))
        notify('הפוסט עודכן')
      } else {
        onSaved(await createPost({ ...fields, group: form.group || undefined }))
        notify('הפוסט פורסם')
        setForm(initialForm(null, form.group)) // מנקים את הטופס, ונשארים באותה קבוצה
        setShowMedia(false)
      }
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <form className="panel form post-form" onSubmit={handleSubmit}>
      <textarea
        name="text"
        rows={3}
        maxLength={2000}
        value={form.text}
        onChange={handleChange}
        placeholder={form.type === 'sale' ? 'מה מוכרים? מצב, מידה...' : 'מה חדש?'}
      />

      <div className="post-form-row">
        {/* סוג הפוסט - רגיל או מכירת ציוד */}
        <div className="segmented">
          <button type="button" className={form.type === 'regular' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'regular' })}>
            פוסט
          </button>
          <button type="button" className={form.type === 'sale' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'sale' })}>
            מכירת ציוד
          </button>
        </div>

        {form.type === 'sale' && (
          <input type="number" name="price" min="0" className="input-small" placeholder="מחיר ב-₪" value={form.price} onChange={handleChange} />
        )}

        {/* בחירת קבוצה - רק בפרסום חדש מהפיד */}
        {!isEdit && groups && (
          <select name="group" value={form.group} onChange={handleChange}>
            <option value="">פוסט אישי (לחברים)</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        )}

        <button type="button" className="button-ghost" onClick={toggleMedia}>
          {showMedia ? 'הסרת תמונה וסרטון' : '+ תמונה או סרטון'}
        </button>
      </div>

      {showMedia && (
        <div className="post-media-fields">
          <ImageEditor initialImage={post?.image} onChange={handleImage} />
          <input name="videoUrl" value={form.videoUrl} onChange={handleChange} placeholder="קישור לסרטון (mp4), לא חובה" dir="ltr" />
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div className="form-footer">
        <button type="submit" disabled={saving}>
          {saving ? 'שומר...' : isEdit ? 'שמירת השינויים' : 'פרסום'}
        </button>
        {onCancel && (
          <button type="button" className="button-secondary" onClick={onCancel}>
            ביטול
          </button>
        )}
      </div>
    </form>
  )
}

export default PostForm
