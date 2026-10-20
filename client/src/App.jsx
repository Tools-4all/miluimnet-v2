// App - הקומפוננטה הראשית. בשלב הזה: בדיקה שהחיבור לשרת עובד (העמודים ייכנסו בצעד הבא)
import { http } from './api/client.js'
import { useFetch } from './hooks/useFetch.js'
import { useAuth } from './context/AuthContext.jsx'
import Loading from './components/ui/Loading.jsx'

function App() {
  const { loading: authLoading } = useAuth()
  const { data, loading, error } = useFetch(() => http.get('/health'))

  if (authLoading || loading) return <Loading />

  return (
    <div className="app">
      <main className="container">
        <h1>מילואימנט</h1>
        <p>{error ? `אין חיבור לשרת: ${error}` : `מחובר לשרת ✓ (${new Date(data.time).toLocaleTimeString('he-IL')})`}</p>
      </main>
    </div>
  )
}

export default App
