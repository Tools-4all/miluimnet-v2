// עמוד של קבוצה: פרטים, הצטרפות/עזיבה, ולמנהל - ניהול בקשות וחברים, עריכה ומחיקה.
// העמוד טוען את הנתונים ומחזיק את הפעולות, והחלקים עצמם מצוירים בקומפוננטות של components/groups
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteGroup, getGroup } from '../api/groups.js'
import { useFetch } from '../hooks/useFetch.js'
import GroupActions from '../components/groups/GroupActions.jsx'
import RequestList from '../components/groups/RequestList.jsx'
import MemberList from '../components/groups/MemberList.jsx'
import Loading from '../components/ui/Loading.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { notify } from '../utils/notify.js'
import { formatMembers } from '../utils/format.js'

function GroupPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: group, error, reload } = useFetch(() => getGroup(id), [id])

  // מריץ פעולה מול השרת, מציג הודעה וטוען את הקבוצה מחדש.
  // עובר לקומפוננטות הבנות, כדי שכולן יטפלו בתשובה ובשגיאות באותה דרך
  async function run(request, successMessage) {
    try {
      await request
      notify(successMessage)
      reload()
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function handleDelete() {
    if (!window.confirm('למחוק את הקבוצה לצמיתות?')) return
    try {
      await deleteGroup(id)
      notify('הקבוצה נמחקה')
      navigate('/groups', { replace: true })
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  if (error) return <EmptyState text={error} />
  // מציגים "טוען" רק בטעינה הראשונה. בטעינה מחדש אחרי פעולה - הקבוצה הקודמת נשארת על המסך
  if (!group) return <Loading />

  return (
    <div>
      <Link to="/groups" className="back-link">
        → לכל הקבוצות
      </Link>

      <section className="panel group-header">
        <div className="pills">
          <span className="pill">{group.unitType}</span>
          <span className="pill">{group.region}</span>
          <span className="pill pill-dark">{group.privacy === 'private' ? 'קבוצה פרטית' : 'קבוצה ציבורית'}</span>
        </div>
        <h1 className="group-title">{group.name}</h1>
        <p className="card-meta">
          {formatMembers(group.memberCount)} · מנהל: <Link to={`/users/${group.admin._id}`}>{group.admin.displayName}</Link>
        </p>
        {group.description && <p className="group-description">{group.description}</p>}
        <GroupActions group={group} run={run} onDelete={handleDelete} />
      </section>

      <RequestList group={group} run={run} />

      <div className="group-layout">
        <div className="group-posts">
          {/* הפוסטים של הקבוצה יתווספו כאן בשלב הפוסטים */}
          {!group.canSeeContent && <EmptyState text="זו קבוצה פרטית. הצטרפו כדי לראות את הפוסטים." />}
        </div>
        <aside>
          <MemberList group={group} run={run} />
        </aside>
      </div>
    </div>
  )
}

export default GroupPage
