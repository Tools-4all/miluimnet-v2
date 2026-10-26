// נקודת הכניסה של צד הלקוח - מכאן React מתחיל לצייר את הדף
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import App from './App.jsx'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter - מעבר בין עמודים. השרת מחזיר index.html לכל כתובת, ו-React מציג את העמוד הנכון */}
    <BrowserRouter>
      {/* AuthProvider - כל הקומפוננטות יודעות מי מחובר */}
      <AuthProvider>
        {/* SocketProvider - חיבור אחד לצ'אט, בתוך AuthProvider כי הוא צריך לדעת מי מחובר */}
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
