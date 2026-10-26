// בקשות ההצטרפות שממתינות לאישור - מוצג רק למנהל הקבוצה
import { approveRequest, rejectRequest } from '../../api/groups.js'
import UserRow from '../ui/UserRow.jsx'

function RequestList({ group, run }) {
  if (!group.isAdmin || group.pendingRequests.length === 0) return null

  return (
    <section className="panel">
      <h2>בקשות הצטרפות ({group.pendingRequests.length})</h2>
      {group.pendingRequests.map((u) => (
        <UserRow key={u._id} user={u}>
          <button onClick={() => run(approveRequest(group._id, u._id), 'הבקשה אושרה')}>אישור</button>
          <button className="button-secondary" onClick={() => run(rejectRequest(group._id, u._id), 'הבקשה נדחתה')}>
            דחייה
          </button>
        </UserRow>
      ))}
    </section>
  )
}

export default RequestList
