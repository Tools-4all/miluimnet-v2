// טופס החיפוש המתקדם בפוסטים (סעיף 20): טקסט, קבוצה, סוג, טווח תאריכים וטווח מחירים.
// onSearch(filters) - נקרא בלחיצה על "חיפוש", רק עם השדות שמולאו
import { useState } from 'react'
import { getGroups } from '../../api/groups.js'
import { useFetch } from '../../hooks/useFetch.js'

const EMPTY_FILTERS = { q: '', group: '', type: '', from: '', to: '', minPrice: '', maxPrice: '' }

// בדיקות בצד הלקוח. השרת בודק את אותו הדבר שוב
function validate(f) {
  if (f.from && f.to && f.from > f.to) return 'תאריך ההתחלה מאוחר מתאריך הסיום'
  if (f.minPrice !== '' && f.maxPrice !== '' && Number(f.minPrice) > Number(f.maxPrice)) {
    return 'מחיר המינימום גבוה ממחיר המקסימום'
  }
  return ''
}

function PostFilters({ onSearch }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [error, setError] = useState('')
  const { data: groups } = useFetch(() => getGroups(), []) // לתפריט בחירת הקבוצה

  function handleChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const problem = validate(filters)
    setError(problem)
    if (problem) return
    // שולחים לשרת רק את השדות שמולאו
    onSearch(Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')))
  }

  return (
    <form className="panel form search-form" onSubmit={handleSubmit}>
      <div className="form-row form-row-3">
        <label>
          טקסט
          <input name="q" value={filters.q} onChange={handleChange} placeholder="לדוגמה: וסט" />
        </label>
        <label>
          קבוצה
          <select name="group" value={filters.group} onChange={handleChange}>
            <option value="">כל הקבוצות</option>
            {groups?.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          סוג
          <select name="type" value={filters.type} onChange={handleChange}>
            <option value="">הכל</option>
            <option value="regular">פוסטים רגילים</option>
            <option value="sale">מכירת ציוד</option>
          </select>
        </label>
      </div>
      <div className="form-row form-row-4">
        <label>
          מתאריך
          <input type="date" name="from" value={filters.from} onChange={handleChange} />
        </label>
        <label>
          עד תאריך
          <input type="date" name="to" value={filters.to} onChange={handleChange} />
        </label>
        <label>
          מחיר מ-
          <input type="number" min="0" name="minPrice" value={filters.minPrice} onChange={handleChange} />
        </label>
        <label>
          מחיר עד
          <input type="number" min="0" name="maxPrice" value={filters.maxPrice} onChange={handleChange} />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-footer">
        <button type="submit">חיפוש</button>
        <button type="button" className="button-secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
          ניקוי
        </button>
      </div>
    </form>
  )
}

export default PostFilters
