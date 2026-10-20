// רשימת משתמשים עם חיפוש (List + Search של מודל המשתמשים)
import { useState } from 'react'
import { getUsers } from '../api/users.js'
import { useFetch } from '../hooks/useFetch.js'
import UserCard from '../components/users/UserCard.jsx'
import Loading from '../components/ui/Loading.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

const EMPTY_FILTERS = { q: '', unit: '', city: '' }

function Users() {
  // filters - מה שמוקלד בשדות. search - החיפוש שנשלח בפועל (מתעדכן רק בלחיצה על "חיפוש")
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [search, setSearch] = useState(EMPTY_FILTERS)
  // useFetch טוען מחדש בכל פעם ש-search משתנה
  const { data: users, loading, error } = useFetch(() => getUsers(search), [search])

  function handleChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  function handleSearch(e) {
    e.preventDefault()
    setSearch(filters)
  }

  return (
    <div>
      <div className="page-header">
        <h1>משתמשים</h1>
        <p>חפשו חברים מהיחידה או מהאזור.</p>
      </div>

      <form className="filters" onSubmit={handleSearch}>
        <input name="q" className="filters-search" placeholder="שם או שם משתמש" value={filters.q} onChange={handleChange} />
        <input name="unit" placeholder="יחידה" value={filters.unit} onChange={handleChange} />
        <input name="city" placeholder="עיר" value={filters.city} onChange={handleChange} />
        <button type="submit">חיפוש</button>
      </form>

      {loading && <Loading />}
      {error && <p className="error">{error}</p>}
      {!loading && users?.length === 0 && <EmptyState text="לא נמצאו משתמשים." />}

      <div className="user-grid">
        {users?.map((u) => (
          <UserCard key={u._id} user={u} />
        ))}
      </div>
    </div>
  )
}

export default Users
