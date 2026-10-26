// עורך תמונה עם Canvas (סעיף 26): מקטין, מסובב ומוסיף פילטר לפני ההעלאה.
// התמונה המקורית נשמרת בצד, ובכל שינוי מציירים אותה מחדש על ה-canvas עם הסיבוב והפילטר.
import { useEffect, useRef, useState } from 'react'
import { FILTERS, applyFilter } from '../../utils/imageFilters.js'

const MAX_SIZE = 800 // רוחב/גובה מקסימלי בפיקסלים

// onChange(dataUrl) - נקרא בכל שינוי עם התמונה המוכנה כטקסט (או '' אם הוסרה).
// צריך להגיע עטוף ב-useCallback, אחרת ה-effect שמצייר ירוץ בכל ציור של ההורה
function ImageEditor({ initialImage = '', onChange }) {
  // useRef - גישה ישירה לאלמנט ה-canvas ולתמונה המקורית, בלי לגרום לציור מחדש של הקומפוננטה
  const canvasRef = useRef(null)
  const originalRef = useRef(null)
  const [hasImage, setHasImage] = useState(false)
  const [filter, setFilter] = useState('none')
  const [rotation, setRotation] = useState(0)
  const [error, setError] = useState('')

  // טוען תמונה (מקובץ או מתמונה קיימת) לתוך אובייקט Image
  function loadImage(src) {
    const img = new Image()
    img.onload = () => {
      originalRef.current = img
      setFilter('none')
      setRotation(0)
      setHasImage(true)
    }
    img.onerror = () => setError('לא הצלחנו לקרוא את התמונה')
    img.src = src
  }

  // בעריכת פוסט קיים - מתחילים מהתמונה שכבר יש (רק בפעם הראשונה)
  useEffect(() => {
    if (initialImage) loadImage(initialImage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // בכל שינוי של פילטר או סיבוב - מציירים מחדש על ה-canvas ומעדכנים את הטופס
  useEffect(() => {
    const img = originalRef.current
    const canvas = canvasRef.current
    if (!hasImage || !img || !canvas) return

    const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const sideways = rotation % 180 !== 0 // ב-90 או 270 מעלות הרוחב והגובה מתחלפים
    canvas.width = sideways ? h : w
    canvas.height = sideways ? w : h

    const ctx = canvas.getContext('2d')
    ctx.save()
    // מזיזים את נקודת האפס למרכז, מסובבים, ומציירים את התמונה סביב המרכז
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
    ctx.restore()

    if (filter !== 'none') {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      ctx.putImageData(applyFilter(data, filter), 0, 0)
    }

    // JPEG באיכות 80% - קטן בהרבה מ-PNG
    onChange(canvas.toDataURL('image/jpeg', 0.8))
  }, [hasImage, filter, rotation, onChange])

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('אפשר לבחור רק קובץ תמונה')
    setError('')
    const reader = new FileReader()
    reader.onload = () => loadImage(reader.result)
    reader.readAsDataURL(file)
  }

  function removeImage() {
    originalRef.current = null
    setHasImage(false)
    onChange('')
  }

  return (
    <div className="image-editor">
      <input type="file" accept="image/*" onChange={handleFile} className="file-input" />
      {error && <p className="error">{error}</p>}

      {/* ה-canvas תמיד קיים (כדי שה-ref יעבוד), ומוסתר כשאין תמונה */}
      <canvas ref={canvasRef} className="editor-canvas" hidden={!hasImage} />

      {hasImage && (
        <div className="editor-tools">
          {Object.entries(FILTERS).map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={filter === key ? 'chip chip-active' : 'chip'}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
          <button type="button" className="chip" onClick={() => setRotation((rotation + 90) % 360)}>
            ↻ סיבוב
          </button>
          <button type="button" className="chip chip-danger" onClick={removeImage}>
            הסרת התמונה
          </button>
        </div>
      )}
    </div>
  )
}

export default ImageEditor
