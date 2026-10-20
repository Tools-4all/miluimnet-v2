// Context = דרך לשתף מידע עם כל הקומפוננטות בלי להעביר אותו ב-props.
// כאן משתפים: מי המשתמש המחובר, ופונקציות להרשמה, התחברות והתנתקות.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth.js'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // loading = true עד שהשרת עונה אם יש משתמש מחובר (לפי ה-cookie של ה-session)
  const [loading, setLoading] = useState(true)

  // טוען מחדש את פרטי המשתמש (למשל כדי לעדכן מונים בתפריט)
  const refreshUser = useCallback(async () => {
    try {
      setUser(await authApi.getMe())
    } catch {
      setUser(null)
    }
  }, [])

  // בטעינה הראשונה: שואלים את השרת מי מחובר.
  // active - אם הקומפוננטה נעלמה לפני שהתשובה הגיעה, לא מעדכנים state
  useEffect(() => {
    let active = true
    authApi
      .getMe()
      .then((me) => active && setUser(me))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  async function login(username, password) {
    setUser(await authApi.login(username, password))
  }

  async function register(details) {
    setUser(await authApi.register(details))
  }

  async function logout() {
    await authApi.logout()
    setUser(null)
  }

  return (
    // setUser משותף גם הוא - כדי שעמוד הפרופיל יעדכן את המשתמש אחרי עריכה
    <AuthContext.Provider value={{ user, setUser, refreshUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// hook קטן שלנו - כל קומפוננטה כותבת useAuth() ומקבלת את המשתמש
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
