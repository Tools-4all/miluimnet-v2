// App - הקומפוננטה הראשית: המבנה הקבוע של הדף, ואיזה עמוד מוצג לפי הכתובת
import { Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/layout/Navbar.jsx'
import RequireAuth from './components/layout/RequireAuth.jsx'
import Loading from './components/ui/Loading.jsx'
import EmptyState from './components/ui/EmptyState.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Users from './pages/Users.jsx'
import Profile from './pages/Profile.jsx'
import Groups from './pages/Groups.jsx'
import GroupForm from './pages/GroupForm.jsx'
import GroupPage from './pages/GroupPage.jsx'
import SearchPosts from './pages/SearchPosts.jsx'
import Friends from './pages/Friends.jsx'
import Messages from './pages/Messages.jsx'

// עמוד שדורש התחברות
const privatePage = (page) => <RequireAuth>{page}</RequireAuth>

function App() {
  const { loading } = useAuth()

  // עד שהשרת עונה אם יש משתמש מחובר - לא מציגים עמודים
  if (loading) return <Loading />

  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={privatePage(<Home />)} />
          <Route path="/users" element={privatePage(<Users />)} />
          {/* :id הוא פרמטר - החלק בכתובת שמשתנה לכל משתמש */}
          <Route path="/users/:id" element={privatePage(<Profile />)} />
          <Route path="/groups" element={privatePage(<Groups />)} />
          {/* new מוגדר לפני :id, אחרת "new" היה נחשב מזהה של קבוצה */}
          <Route path="/groups/new" element={privatePage(<GroupForm />)} />
          <Route path="/groups/:id" element={privatePage(<GroupPage />)} />
          <Route path="/groups/:id/edit" element={privatePage(<GroupForm />)} />
          <Route path="/search" element={privatePage(<SearchPosts />)} />
          <Route path="/friends" element={privatePage(<Friends />)} />
          <Route path="/messages" element={privatePage(<Messages />)} />
          <Route path="/messages/:userId" element={privatePage(<Messages />)} />
          <Route path="*" element={<EmptyState text="העמוד לא נמצא." />} />
        </Routes>
      </main>
      <footer className="footer">מילואימנט · הרשת החברתית של המילואימניקים</footer>
    </div>
  )
}

export default App
