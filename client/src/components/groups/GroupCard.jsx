// כרטיס של קבוצה ברשימה: תגיות, שם, תיאור קצר ומספר חברים
import { Link } from 'react-router-dom'
import { formatMembers } from '../../utils/format.js'

function GroupCard({ group }) {
  return (
    <Link to={`/groups/${group._id}`} className="panel group-card">
      <div className="pills">
        <span className="pill">{group.unitType}</span>
        <span className="pill">{group.region}</span>
        {group.privacy === 'private' && <span className="pill pill-dark">פרטית</span>}
        {group.isMember && <span className="pill pill-member">חבר</span>}
      </div>
      <h3>{group.name}</h3>
      <p className="card-meta clamp">{group.description}</p>
      <p className="card-meta">{formatMembers(group.memberCount)}</p>
    </Link>
  )
}

export default GroupCard
