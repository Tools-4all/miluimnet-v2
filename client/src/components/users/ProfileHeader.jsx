// החלק העליון של עמוד פרופיל: תמונה, שם, פרטים, ומספר החברים
import Avatar from '../ui/Avatar.jsx'

function ProfileHeader({ profile }) {
  return (
    <div className="panel profile-header">
      <Avatar user={profile} size={88} />
      <div className="profile-details">
        <h1>{profile.displayName}</h1>
        <p className="card-meta">
          @{profile.username}
          {profile.unit && ` · ${profile.unit}`}
          {profile.city && ` · ${profile.city}`}
        </p>
        {profile.bio && <p className="bio">{profile.bio}</p>}
      </div>
      <div className="stats">
        <div>
          <strong>{profile.friendsCount}</strong>
          <span>חברים</span>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
