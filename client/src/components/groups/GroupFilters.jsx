// טופס החיפוש המתקדם בקבוצות (סעיף 20): שם, סוג יחידה, אזור, מינימום חברים, ורק הקבוצות שלי.
// onSearch(filters) - נקרא בלחיצה על "חיפוש" עם הפרמטרים שמולאו
import { useState } from 'react'
import { useMeta } from '../../hooks/useMeta.js'

const EMPTY_FILTERS = { q: '', unitType: '', region: '', minMembers: '', mine: false }

function GroupFilters({ onSearch }) {
  const { unitTypes, regions } = useMeta()
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFilters({ ...filters, [name]: type === 'checkbox' ? checked : value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (filters.minMembers !== '' && Number(filters.minMembers) < 0) return
    onSearch(filters)
  }

  return (
    <form className="filters" onSubmit={handleSubmit}>
      <input name="q" className="filters-search" placeholder="שם הקבוצה" value={filters.q} onChange={handleChange} />
      <select name="unitType" value={filters.unitType} onChange={handleChange}>
        <option value="">כל סוגי היחידות</option>
        {unitTypes.map((u) => (
          <option key={u}>{u}</option>
        ))}
      </select>
      <select name="region" value={filters.region} onChange={handleChange}>
        <option value="">כל האזורים</option>
        {regions.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <input
        type="number"
        min="0"
        name="minMembers"
        placeholder="מינימום חברים"
        value={filters.minMembers}
        onChange={handleChange}
        className="input-small"
      />
      <label className="checkbox">
        <input type="checkbox" name="mine" checked={filters.mine} onChange={handleChange} />
        רק הקבוצות שלי
      </label>
      <button type="submit">חיפוש</button>
    </form>
  )
}

export default GroupFilters
