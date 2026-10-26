// שורה של משתמש ברשימה: תמונה (עם נקודה ירוקה אם מחובר), שם ויחידה, ומקום לכפתורים בצד.
// משמשת ברשימת החברים, בחברי קבוצה ובבקשות הצטרפות
import { Link } from 'react-router-dom'
import Avatar from './Avatar.jsx'

function UserRow({ user, online = false, badge, children }) {
  return (
    <div className="member-row">
      <Link to={`/users/${user._id}`} className="member-link">
        <span className="avatar-wrap">
          <Avatar user={user} size={40} />
          {online && <span className="online-dot" title="מחובר עכשיו" />}
        </span>
        <span>
          <strong>{user.displayName}</strong>
          {user.unit && <span className="card-meta"> · {user.unit}</span>}
        </span>
        {badge}
      </Link>
      {children && <div className="actions">{children}</div>}
    </div>
  )
}

export default UserRow
