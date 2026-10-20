// הכפתורים בראש עמוד הקבוצה - משתנים לפי המצב שלי בקבוצה:
//   לא חבר: הצטרפות / בקשת הצטרפות | ממתין: ביטול הבקשה | חבר: עזיבה | מנהל: עריכה ומחיקה
import { Link } from 'react-router-dom'
import { leaveGroup, joinGroup } from '../../api/groups.js'

// run(request, message) - מגיע מהעמוד: מריץ את הפעולה, מציג הודעה וטוען את הקבוצה מחדש
function GroupActions({ group, run, onDelete }) {
  const isPrivate = group.privacy === 'private'

  return (
    <div className="actions">
      {!group.isMember && !group.hasRequested && (
        <button onClick={() => run(joinGroup(group._id), isPrivate ? 'הבקשה נשלחה למנהל' : 'הצטרפת לקבוצה')}>
          {isPrivate ? 'בקשת הצטרפות' : 'הצטרפות לקבוצה'}
        </button>
      )}
      {group.hasRequested && (
        <button className="button-secondary" onClick={() => run(leaveGroup(group._id), 'הבקשה בוטלה')}>
          ממתין לאישור · ביטול הבקשה
        </button>
      )}
      {group.isMember && !group.isAdmin && (
        <button className="button-secondary" onClick={() => run(leaveGroup(group._id), 'עזבת את הקבוצה')}>
          עזיבת הקבוצה
        </button>
      )}
      {group.isAdmin && (
        <>
          <Link to={`/groups/${group._id}/edit`} className="button">
            עריכת הקבוצה
          </Link>
          <button className="button-danger" onClick={onDelete}>
            מחיקת הקבוצה
          </button>
        </>
      )}
    </div>
  )
}

export default GroupActions
