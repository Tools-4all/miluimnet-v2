// בקשות ההצטרפות שממתינות לאישור - מוצג רק למנהל הקבוצה
import { Link } from 'react-router-dom'
import { approveRequest, rejectRequest } from '../../api/groups.js'
import Avatar from '../ui/Avatar.jsx'

function RequestList({ group, run }) {
  if (!group.isAdmin || group.pendingRequests.length === 0) return null

  return (
    <section className="panel">
      <h2>בקשות הצטרפות ({group.pendingRequests.length})</h2>
      {group.pendingRequests.map((u) => (
        <div key={u._id} className="member-row">
          <Link to={`/users/${u._id}`} className="member-link">
            <Avatar user={u} size={36} />
            <span>{u.displayName}</span>
          </Link>
          <div className="actions">
            <button onClick={() => run(approveRequest(group._id, u._id), 'הבקשה אושרה')}>אישור</button>
            <button className="button-secondary" onClick={() => run(rejectRequest(group._id, u._id), 'הבקשה נדחתה')}>
              דחייה
            </button>
          </div>
        </div>
      ))}
    </section>
  )
}

export default RequestList
