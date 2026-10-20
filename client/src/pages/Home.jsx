// העמוד הראשי - בהמשך יהיה כאן הפיד (פוסטים מהקבוצות ומהחברים)
import { useAuth } from '../context/AuthContext.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

function Home() {
  const { user } = useAuth()

  return (
    <div>
      <div className="page-header">
        <h1>שלום, {user.displayName}</h1>
        <p>הרשת החברתית של המילואימניקים: קבוצות לפי יחידה, פוסטים, מכירת ציוד וצ'אט עם החברים.</p>
      </div>
      <EmptyState text="הפיד יופיע כאן אחרי שנוסיף קבוצות ופוסטים." />
    </div>
  )
}

export default Home
