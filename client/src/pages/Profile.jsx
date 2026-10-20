// עמוד פרופיל של משתמש. אם זה הפרופיל שלי - אפשר לערוך (Update) ולמחוק את החשבון (Delete)
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteMyAccount, getUser } from '../api/users.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../context/AuthContext.jsx'
import ProfileHeader from '../components/users/ProfileHeader.jsx'
import ProfileForm from '../components/users/ProfileForm.jsx'
import Loading from '../components/ui/Loading.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { notify } from '../utils/notify.js'

function Profile() {
  const { id } = useParams() // ה-id מהכתובת /users/:id
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const { data: profile, loading, error, setData: setProfile } = useFetch(() => getUser(id), [id])

  const isMe = user?._id === id

  // אחרי שמירה: מעדכנים את הפרופיל בעמוד ואת המשתמש בסרגל הניווט, בלי לטעון מחדש
  function handleSaved(updated) {
    setProfile({ ...profile, ...updated })
    setUser({ ...user, ...updated })
    setEditing(false)
  }

  async function handleDelete() {
    if (!window.confirm('למחוק את החשבון לצמיתות? אי אפשר לבטל את זה.')) return
    try {
      await deleteMyAccount()
      notify('החשבון נמחק')
      // קודם עוברים לעמוד ההתחברות, ורק אז מנקים את המשתמש מה-context
      navigate('/login', { replace: true })
      setUser(null)
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  if (loading) return <Loading />
  if (error) return <EmptyState text={error} />

  return (
    <div className="narrow">
      <ProfileHeader profile={profile} />

      {isMe && !editing && (
        <div className="actions">
          <button onClick={() => setEditing(true)}>עריכת הפרופיל</button>
          <button className="button-danger" onClick={handleDelete}>
            מחיקת החשבון
          </button>
        </div>
      )}

      {isMe && editing && <ProfileForm profile={profile} onSaved={handleSaved} onCancel={() => setEditing(false)} />}
    </div>
  )
}

export default Profile
