// רשימת חברי הקבוצה. למנהל יש כפתור להוציא חבר. בקבוצה פרטית - רק חברים רואים את הרשימה
import { Link } from 'react-router-dom'
import { removeMember } from '../../api/groups.js'
import Avatar from '../ui/Avatar.jsx'

function MemberList({ group, run }) {
  return (
    <section className="panel">
      <h2>חברי הקבוצה</h2>
      {!group.canSeeContent && <p className="card-meta">זו קבוצה פרטית. רק חברים רואים את התוכן שלה.</p>}
      {group.members.map((u) => {
        const isGroupAdmin = u._id === group.admin._id
        return (
          <div key={u._id} className="member-row">
            <Link to={`/users/${u._id}`} className="member-link">
              <Avatar user={u} size={36} />
              <span>{u.displayName}</span>
              {isGroupAdmin && <span className="pill">מנהל</span>}
            </Link>
            {group.isAdmin && !isGroupAdmin && (
              <button className="link-button" onClick={() => run(removeMember(group._id, u._id), 'החבר הוסר מהקבוצה')}>
                הסרה
              </button>
            )}
          </div>
        )
      })}
    </section>
  )
}

export default MemberList
