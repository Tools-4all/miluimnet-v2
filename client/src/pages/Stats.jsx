// עמוד הסטטיסטיקות (סעיף 29): גרפים ב-D3 מנתונים אמיתיים במסד הנתונים
import { getStats } from '../api/stats.js'
import { useFetch } from '../hooks/useFetch.js'
import MonthlyBarChart from '../components/charts/MonthlyBarChart.jsx'
import MonthlyLineChart from '../components/charts/MonthlyLineChart.jsx'
import HorizontalBarChart from '../components/charts/HorizontalBarChart.jsx'
import DataTable from '../components/charts/DataTable.jsx'
import Loading from '../components/ui/Loading.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

// "2026-09" -> "ספטמבר 2026"
function monthName(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
}

const TILES = [
  ['users', 'משתמשים'],
  ['groups', 'קבוצות'],
  ['posts', 'פוסטים'],
  ['sales', 'פוסטי מכירה'],
  ['messages', "הודעות בצ'אט"],
]

function Stats() {
  const { data: stats, error, reload } = useFetch(getStats, [])

  if (error) return <EmptyState text={error} />
  if (!stats) return <Loading />

  const { totals, postsPerMonth, topGroups } = stats

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1>סטטיסטיקות</h1>
          <p>הנתונים מחושבים ממסד הנתונים ברגע הטעינה.</p>
        </div>
        <button className="button-secondary" onClick={reload}>
          ↻ רענון
        </button>
      </div>

      <div className="stat-tiles">
        {TILES.map(([key, title]) => (
          <div key={key} className="panel stat-tile">
            <strong>{totals[key]}</strong>
            <span>{title}</span>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <section className="panel">
          <h2>פוסטים לפי חודש</h2>
          <p className="card-meta">12 החודשים האחרונים</p>
          <MonthlyBarChart data={postsPerMonth.map((m) => ({ month: m.month, value: m.posts }))} label="פוסטים" />
          <DataTable
            rows={postsPerMonth}
            columns={[
              { key: 'month', title: 'חודש', format: monthName },
              { key: 'posts', title: 'פוסטים' },
              { key: 'sales', title: 'מתוכם מכירה' },
            ]}
          />
        </section>

        <section className="panel">
          <h2>ממוצע פוסטים לקבוצה בחודש</h2>
          <p className="card-meta">פוסטים בקבוצות בחודש ÷ מספר הקבוצות</p>
          <MonthlyLineChart data={postsPerMonth.map((m) => ({ month: m.month, value: m.avgPerGroup }))} label="ממוצע לקבוצה" />
          <DataTable
            rows={postsPerMonth}
            columns={[
              { key: 'month', title: 'חודש', format: monthName },
              { key: 'avgPerGroup', title: 'ממוצע פוסטים לקבוצה' },
            ]}
          />
        </section>

        <section className="panel chart-wide">
          <h2>הקבוצות הכי פעילות</h2>
          <p className="card-meta">מספר הפוסטים בכל קבוצה</p>
          {topGroups.length === 0 ? (
            <p className="card-meta">עוד אין פוסטים בקבוצות.</p>
          ) : (
            <HorizontalBarChart data={topGroups.map((g) => ({ name: g.name, value: g.posts }))} label="פוסטים" />
          )}
          <DataTable
            rows={topGroups}
            columns={[
              { key: 'name', title: 'קבוצה' },
              { key: 'posts', title: 'פוסטים' },
              { key: 'members', title: 'חברים' },
            ]}
          />
        </section>
      </div>
    </div>
  )
}

export default Stats
