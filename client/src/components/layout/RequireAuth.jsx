// עוטף עמודים שדורשים התחברות: מי שלא מחובר מועבר לעמוד ההתחברות.
// (זו נוחות בממשק. ההגנה האמיתית היא בשרת - requireLogin מחזיר 401 בכל מקרה)
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default RequireAuth
