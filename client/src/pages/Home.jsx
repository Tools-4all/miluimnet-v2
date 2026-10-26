// העמוד הראשי - הפיד: פוסטים מהקבוצות שלי ומהחברים שלי (סעיף 22)
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getFeed } from '../api/posts.js'
import { getGroups } from '../api/groups.js'
import { useFetch } from '../hooks/useFetch.js'
import PostFeed from '../components/posts/PostFeed.jsx'

function Home() {
  const { user } = useAuth()
  // הקבוצות שלי - לתפריט "איפה לפרסם" בטופס
  const { data: myGroups } = useFetch(() => getGroups({ mine: 'true' }), [])

  return (
    <div className="feed-layout">
      <section className="hero">
        <h1>שלום, {user.displayName}</h1>
        <p>מה קורה ביחידה? פרסמו עדכון, שאלו שאלה או מכרו ציוד שכבר לא צריך.</p>
      </section>

      <PostFeed
        fetchPage={getFeed}
        form={{ groups: myGroups || [] }}
        emptyText="הפיד ריק. הצטרפו לקבוצות או הוסיפו חברים כדי לראות כאן פוסטים."
      />
      <p className="card-meta center">
        <Link to="/groups">לחיפוש קבוצות להצטרף אליהן</Link>
      </p>
    </div>
  )
}

export default Home
