// סרגל הניווט העליון - מופיע בכל העמודים
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Avatar from '../ui/Avatar.jsx'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">מ</span>
          <span>
            <span className="logo-name">מילואימנט</span>
            <span className="logo-tagline">הרשת החברתית של המילואימניקים</span>
          </span>
        </Link>

        {/* NavLink מוסיף את המחלקה active לקישור של העמוד הנוכחי */}
        {user && (
          <nav className="nav-links">
            <NavLink to="/" end>
              פיד
            </NavLink>
            <NavLink to="/groups">קבוצות</NavLink>
            <NavLink to="/users">משתמשים</NavLink>
            <NavLink to="/search">חיפוש</NavLink>
          </nav>
        )}

        <div className="nav-actions">
          {user ? (
            <>
              <Link to={`/users/${user._id}`} className="nav-user">
                <Avatar user={user} size={34} />
                <span>{user.displayName}</span>
              </Link>
              <button className="button-ghost" onClick={handleLogout}>
                התנתקות
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="button button-ghost">
                התחברות
              </Link>
              <Link to="/register" className="button">
                הרשמה
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
