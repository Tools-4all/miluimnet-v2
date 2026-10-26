// רשימת חברי הקבוצה. למנהל יש כפתור להוציא חבר. בקבוצה פרטית - רק חברים רואים את הרשימה
import { removeMember } from '../../api/groups.js'
import { useSocket } from '../../context/SocketContext.jsx'
import UserRow from '../ui/UserRow.jsx'

function MemberList({ group, run }) {
  const { onlineIds } = useSocket()

  return (
    <section className="panel">
      <h2>חברי הקבוצה</h2>
      {!group.canSeeContent && <p className="card-meta">זו קבוצה פרטית. רק חברים רואים את התוכן שלה.</p>}
      {group.members.map((u) => {
        const isGroupAdmin = u._id === group.admin._id
        return (
          <UserRow key={u._id} user={u} online={onlineIds.includes(u._id)} badge={isGroupAdmin && <span className="pill">מנהל</span>}>
            {group.isAdmin && !isGroupAdmin && (
              <button className="link-button" onClick={() => run(removeMember(group._id, u._id), 'החבר הוסר מהקבוצה')}>
                הסרה
              </button>
            )}
          </UserRow>
        )
      })}
    </section>
  )
}

export default MemberList
