// רשימת קבוצות עם חיפוש מתקדם (List + Search של מודל הקבוצות)
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getGroups } from '../api/groups.js'
import { useFetch } from '../hooks/useFetch.js'
import GroupFilters from '../components/groups/GroupFilters.jsx'
import GroupCard from '../components/groups/GroupCard.jsx'
import Loading from '../components/ui/Loading.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

// השרת מחפש mine=true כמחרוזת, אז שולחים את mine רק כשהוא מסומן
function toQuery({ mine, ...rest }) {
  return mine ? { ...rest, mine: 'true' } : rest
}

function Groups() {
  // search - החיפוש שנשלח בפועל. מתעדכן רק בלחיצה על "חיפוש" בטופס
  const [search, setSearch] = useState({}) // בהתחלה - בלי סינון, כל הקבוצות
  const { data: groups, loading, error } = useFetch(() => getGroups(toQuery(search)), [search])

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1>קבוצות</h1>
          <p>קבוצות של גדודים, פלוגות וצוותים.</p>
        </div>
        <Link to="/groups/new" className="button">
          + קבוצה חדשה
        </Link>
      </div>

      <GroupFilters onSearch={setSearch} />

      {loading && <Loading />}
      {error && <p className="error">{error}</p>}
      {!loading && groups?.length === 0 && <EmptyState text="לא נמצאו קבוצות." />}

      <div className="grid">
        {groups?.map((g) => (
          <GroupCard key={g._id} group={g} />
        ))}
      </div>
    </div>
  )
}

export default Groups
