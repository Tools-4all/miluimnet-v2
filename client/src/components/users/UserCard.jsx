// כרטיס של משתמש ברשימה: תמונה, שם, שם משתמש, יחידה ועיר
import { Link } from 'react-router-dom'
import Avatar from '../ui/Avatar.jsx'

function UserCard({ user }) {
  return (
    <Link to={`/users/${user._id}`} className="panel user-card">
      <Avatar user={user} size={56} />
      <div>
        <strong>{user.displayName}</strong>
        <span className="card-meta">@{user.username}</span>
        {/* filter(Boolean) - מדלג על שדות ריקים, כדי שלא יופיע " · " מיותר */}
        <span className="card-meta">{[user.unit, user.city].filter(Boolean).join(' · ')}</span>
      </div>
    </Link>
  )
}

export default UserCard
