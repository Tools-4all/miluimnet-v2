// עמוד החברים: בקשות חברות שקיבלתי (אישור/דחייה) ורשימת החברים שלי (הסרה)
import { Link } from 'react-router-dom'
import { acceptFriendRequest, getFriends, rejectFriendRequest, removeFriend } from '../api/friends.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import UserRow from '../components/ui/UserRow.jsx'
import Loading from '../components/ui/Loading.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { notify } from '../utils/notify.js'

function Friends() {
  const { refreshUser } = useAuth()
  const { onlineIds } = useSocket()
  const { data, error, reload } = useFetch(getFriends, [])

  // מריץ פעולה, מציג הודעה, טוען מחדש ומעדכן את המונה בתפריט
  async function run(request, message) {
    try {
      await request
      notify(message)
      reload()
      refreshUser()
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  if (error) return <EmptyState text={error} />
  if (!data) return <Loading />
  const { friends, requests } = data

  return (
    <div className="narrow">
      <div className="page-header page-header-row">
        <div>
          <h1>חברים</h1>
          <p>הפוסטים האישיים של החברים שלך מופיעים בפיד.</p>
        </div>
        <Link to="/users" className="button">
          חיפוש חברים
        </Link>
      </div>

      {requests.length > 0 && (
        <section className="panel">
          <h2>בקשות חברות ({requests.length})</h2>
          {requests.map((u) => (
            <UserRow key={u._id} user={u}>
              <button onClick={() => run(acceptFriendRequest(u._id), 'הבקשה אושרה')}>אישור</button>
              <button className="button-secondary" onClick={() => run(rejectFriendRequest(u._id), 'הבקשה נדחתה')}>
                דחייה
              </button>
            </UserRow>
          ))}
        </section>
      )}

      <section className="panel">
        <h2>החברים שלי ({friends.length})</h2>
        {friends.length === 0 && <p className="card-meta">עוד אין לך חברים. אפשר לחפש לפי שם או יחידה בעמוד המשתמשים.</p>}
        {friends.map((u) => (
          <UserRow key={u._id} user={u} online={onlineIds.includes(u._id)}>
            <Link to={`/messages/${u._id}`} className="link-button">
              הודעה
            </Link>
            <button
              className="link-button link-danger"
              onClick={() => window.confirm(`להסיר את ${u.displayName} מהחברים?`) && run(removeFriend(u._id), 'החבר הוסר')}
            >
              הסרה
            </button>
          </UserRow>
        ))}
      </section>
    </div>
  )
}

export default Friends
