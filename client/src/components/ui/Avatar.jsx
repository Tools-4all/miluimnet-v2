// תמונת פרופיל עגולה. אם אין תמונה - עיגול עם האות הראשונה של השם
function Avatar({ user, size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.45 }

  if (user?.avatar) {
    return <img src={user.avatar} alt="" className="avatar" style={style} />
  }
  return (
    <span className="avatar avatar-letter" style={style}>
      {user?.displayName?.[0] || '?'}
    </span>
  )
}

export default Avatar
