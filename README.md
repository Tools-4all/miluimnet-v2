# 🪖 מילואימנט

רשת חברתית למילואימניקים - פרויקט גמר בקורס פיתוח אפליקציות אינטרנטיות.

קבוצות לפי יחידה ואזור, פוסטים עם תמונות וסרטונים, מכירת ציוד בין מילואימניקים, חברים, צ'אט בזמן אמת וגרפים מנתוני האתר.

> **גרסה 2** נבנתה בהדרגה מתוך גרסה 1, וכל חלק עבר סקירה ושיפור לפני שנכנס.
> השיפורים העיקריים לעומת גרסה 1 מפורטים [בהמשך](#מה-השתפר-לעומת-גרסה-1).

## טכנולוגיות

| חלק | טכנולוגיה |
|---|---|
| שרת | Node.js 22, Express 5, במבנה MVC |
| מסד נתונים | MongoDB Atlas דרך Mongoose 9 |
| התחברות | express-session, ה-sessions נשמרים ב-MongoDB (connect-mongo), סיסמאות עם bcrypt |
| צד לקוח | React 19 (Vite), React Router, קריאות לשרת עם jQuery Ajax |
| צ'אט | Socket.io |
| גרפים | D3.js |
| בדיקות | מנגנון הבדיקות המובנה של Node (`node --test`), על מסד נתונים נפרד |

## הרצה

1. התקנה של השרת ושל הלקוח:
   ```bash
   npm run setup
   ```
2. מעתיקים את `.env.example` ל-`.env` וממלאים: כתובת MongoDB, סוד ל-session, וסיסמה למשתמשי הדוגמה.
3. נתוני דוגמה (לא חובה): 41 משתמשים, 12 קבוצות, 280 פוסטים ושיחות בצ'אט.
   ```bash
   npm run seed
   ```
   הרצה חוזרת מוחקת רק את נתוני הדוגמה מההרצה הקודמת. כל משתמשי הדוגמה מתחברים עם `SEED_PASSWORD` מה-`.env` (למשל `admin`, מנהל האתר).
4. פיתוח - השרת (פורט 3000) והלקוח (פורט 5173) יחד:
   ```bash
   npm run dev
   ```
   ופותחים את http://localhost:5173

| פקודה | מה עושה |
|---|---|
| `npm test` | 46 בדיקות אוטומטיות של ה-API והצ'אט, על מסד `miluimnet_test` שנמחק בסוף |
| `npm run build` | בונה את הלקוח לתיקייה `client/dist` |
| `npm start` | מריץ את השרת בלבד. אחרי build הוא מגיש גם את האתר: http://localhost:3000 |

## מבנה הקוד

```
server/
  server.js        נקודת הכניסה: חיבור למסד, שרת HTTP ו-Socket.io
  app.js           Express: middleware, הנתיבים, טיפול בשגיאות, והגשת האתר אחרי build
  socket.js        הצ'אט בזמן אמת
  config/          חיבור למסד, session, רשימות קבועות (סוגי יחידות ואזורים)
  models/          User, Group, Post, Message - השדות, בדיקות התקינות ופעולות (methods)
  routes/          הכתובות, ואיזה middleware רץ לפני כל פעולה
  middleware/      התחברות, הרשאות (מנהל קבוצה, כותב פוסט), טעינת קבוצה/פוסט/משתמש, שגיאות
  controllers/     מה עושים בכל בקשה
  services/        כללים שנוגעים בכמה מודלים: מי רואה איזה פוסט, מי יכול לשוחח עם מי, מחיקות
  utils/           שגיאות HTTP, הודעות שגיאה, regex בטוח
  seed/            נתוני הדוגמה
tests/             בדיקות אוטומטיות
client/src/
  api/             פונקציה לכל קריאה לשרת, מעל $.ajax של jQuery (api/client.js)
  hooks/           useFetch, usePosts, useChat, useMeta, useD3
  context/         המשתמש המחובר (AuthContext), והחיבור לצ'אט (SocketContext)
  components/      לפי נושא: ui, layout, users, groups, posts, friends, chat, charts
  pages/           עמוד לכל כתובת
  styles/          CSS לפי נושא, עם משתנים לצבעים ב-base.css
```

הדרך של בקשה: קומפוננטה ← פונקציה ב-`api/` ← `$.ajax` ← Express ← session ← middleware של הרשאות ← controller ← model ← MongoDB.
כל שגיאה בדרך מגיעה ל-`errorHandler`, שמחזיר הודעה מסודרת בעברית. השרת לא קורס.

## איפה כל דרישה

| סעיף | דרישה | איפה |
|---|---|---|
| 15–17 | Node + Express, MongoDB, MVC | `server/models`, `server/controllers`, `server/routes` |
| 18–19 | לפחות 3 מודלים עם יצירה, עדכון, מחיקה, רשימה וחיפוש מהממשק | משתמשים, קבוצות, פוסטים (והודעות) |
| 20 | 2 חיפושים מתקדמים, 3 פרמטרים לפחות | קבוצות: שם, סוג יחידה, אזור, מינימום חברים, רק שלי (`groupController.listGroups`, aggregation). פוסטים: טקסט, קבוצה, סוג, טווח תאריכים, טווח מחירים (`postController.listPosts`) |
| 21 | התחברות, אישור מנהל, קבוצות פרטיות, עריכה ומחיקה רק של תוכן שלך | `middleware/auth.js`, `groupAccess.js`, `postAccess.js`, `services/postVisibility.js` |
| 22 | פיד של קבוצות וחברים | `services/postVisibility.js` (`feedFilter`), `pages/Home.jsx` |
| 23 | נתוני דוגמה | `npm run seed` (`server/seed`) |
| 24 | מקרי קצה, השרת לא קורס | `utils/errorResponse.js`, בדיקות התקינות במודלים, ו-`tests/` |
| 25 | jQuery Ajax | כל הקריאות לשרת: `client/src/api/client.js`. הודעות קופצות: `utils/notify.js` |
| 26 | React עם Video ו-Canvas | `components/posts/VideoPlayer.jsx` (נגן עם כפתורים משלנו), `components/posts/ImageEditor.jsx` (פילטרים וסיבוב), הקטנת תמונת פרופיל ב-`utils/resizeImage.js` |
| 27 | CSS3 | text-shadow ו-multiple-columns בעמוד קבוצה (`groups.css`), transition בכרטיסים, border-radius בכל האתר, @font-face (`fonts.css`) |
| 28 | צ'אט ב-Socket.io | `server/socket.js`, `hooks/useChat.js`, `pages/Messages.jsx` |
| 29 | 2 גרפים לפחות ב-D3 מנתוני המסד | `pages/Stats.jsx`, `components/charts/`, הנתונים מ-`statsController.js` |

## אבטחה

- סיסמאות נשמרות רק כ-hash של bcrypt. השדה לא חוזר מהמסד בלי בקשה מפורשת.
- ה-cookie של ההתחברות הוא `httpOnly` ו-`sameSite: lax`. הסודות נמצאים רק ב-`.env`, שלא עולה ל-git.
- כל הרשאה נבדקת בשרת, לא רק בהסתרת כפתורים. חיפוש לא יכול לחשוף פוסטים מקבוצה פרטית.
- טקסט חיפוש עובר `escapeRegex`, ועדכון פרופיל מקבל רק שדות מותרים.
- בגרפים, שמות שמשתמשים כתבו מוצגים עם `text()` ולא כ-HTML.

## מה השתפר לעומת גרסה 1

- שכבת `services` לכללים שנוגעים בכמה מודלים, ו-middleware להרשאות, במקום קוד שחוזר ב-controllers.
- רשימות סוגי היחידות והאזורים במקום אחד בשרת, והלקוח מקבל אותן מ-`/api/meta`.
- hooks משותפים בלקוח: `useFetch`, `usePosts` (פיד, חיפוש, קבוצה ופרופיל משתמשים באותו קוד), `useChat`, `useD3`.
- בדיקות אוטומטיות לכל ה-API ולצ'אט.
- תיקוני באגים: לייק וסימון "נמכר" שנלחצו מהר דרסו זה את זה; שמות קבוצות הוצגו כ-HTML בגרפים (XSS); הגופן Heebo לא נטען בכלל; אינדקסים ייחודיים לא נבנו לפני הבקשה הראשונה.

הגופן Heebo מופץ ברישיון SIL Open Font License (`client/src/assets/fonts/OFL.txt`).
