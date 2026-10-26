// ממלא את מסד הנתונים בנתונים לדוגמה (סעיף 23): משתמשים, קבוצות, חברויות, פוסטים והודעות.
// הרצה: npm run seed
//
// - הסיסמה של כל משתמשי הדוגמה נלקחת מ-SEED_PASSWORD בקובץ .env (לא נשמרת בקוד).
// - הרצה חוזרת מוחקת קודם את מה שהסקריפט יצר בפעם הקודמת (לפי שמות המשתמשים של הדוגמה).
//   משתמשים אמיתיים שנרשמו באתר לא נמחקים, אבל הקשרים שלהם עם משתמשי הדוגמה (חברויות, לייקים) כן.
require('dotenv').config({ quiet: true })
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const User = require('../models/User')
const Group = require('../models/Group')
const Post = require('../models/Post')
const Message = require('../models/Message')
const data = require('./data')
const { random, randInt, pick, pickMany, daysAgo } = require('./random')

// היחידה של כל "קבוצת בית" (מספר הקבוצה ב-data.GROUPS -> שם היחידה בפרופיל)
const HOME_GROUPS = {
  0: 'גדוד 8101',
  1: 'גדוד 9213',
  3: 'גדוד הנדסה 7064',
  4: 'סוללה 334',
  7: 'חובשים - מילואים',
  8: 'תקשוב',
  9: 'לוגיסטיקה',
  11: 'חיל האוויר',
}
const PUBLIC_EXTRA_GROUPS = [2, 5, 6, 10] // קבוצות כלליות שמצטרפים אליהן בנוסף
const POSTS_COUNT = 280

// ---------- 1. רשימת המשתמשים (עוד לא במסד) ----------
function buildUserSpecs() {
  const specs = []
  const used = new Set()
  const people = [...data.MALE_NAMES.slice(0, 28), ...data.FEMALE_NAMES.slice(0, 12)]
  for (const [heFirst, enFirst] of people) {
    const [heLast, enLast] = pick(data.LAST_NAMES)
    let username = `${enFirst}_${enLast}`
    while (used.has(username)) username = `${enFirst}_${enLast}${randInt(1, 99)}`
    used.add(username)
    const homeGroup = Number(pick(Object.keys(HOME_GROUPS)))
    specs.push({
      username,
      displayName: `${heFirst} ${heLast}`,
      unit: HOME_GROUPS[homeGroup],
      city: pick(data.CITIES),
      bio: pick(data.BIOS),
      homeGroup,
      createdAt: daysAgo(randInt(200, 360)),
    })
  }
  // מנהל האתר
  specs.push({
    username: 'admin',
    displayName: 'מנהל האתר',
    unit: 'צוות מילואימנט',
    city: 'תל אביב',
    bio: 'מנהל האתר. פנו אליי בכל שאלה.',
    role: 'admin',
    homeGroup: 2,
    createdAt: daysAgo(365),
  })
  return specs
}

// ---------- 2. מחיקת נתוני דוגמה מהרצה קודמת ----------
async function removePreviousSeed(usernames) {
  const ids = (await User.find({ username: { $in: usernames } }).select('_id')).map((u) => u._id)
  if (ids.length === 0) return 0
  const groupIds = (await Group.find({ admin: { $in: ids } }).select('_id')).map((g) => g._id)

  await Post.deleteMany({ $or: [{ author: { $in: ids } }, { group: { $in: groupIds } }] })
  await Message.deleteMany({ $or: [{ from: { $in: ids } }, { to: { $in: ids } }] })
  await Group.deleteMany({ _id: { $in: groupIds } })
  await User.deleteMany({ _id: { $in: ids } })
  // מנקים הפניות שנשארו אצל משתמשים אמיתיים (למשל חבר שהיה משתמש דוגמה)
  await User.updateMany({}, { $pull: { friends: { $in: ids }, friendRequests: { $in: ids } } })
  await Group.updateMany({}, { $pull: { members: { $in: ids }, pendingRequests: { $in: ids } } })
  await Post.updateMany({}, { $pull: { likes: { $in: ids } } })
  return ids.length
}

// ---------- 3. משתמשים ----------
async function createUsers(specs) {
  // גיבוב אחד לכולם (אותה סיסמה) - חוסך זמן, כי bcrypt איטי בכוונה
  const passwordHash = await User.hashPassword(process.env.SEED_PASSWORD)
  return User.insertMany(
    specs.map((spec) => {
      const fields = { ...spec, role: spec.role || 'user', passwordHash }
      delete fields.homeGroup // משמש רק לבניית הקבוצות, לא נשמר במשתמש
      return fields
    }),
  )
}

// ---------- 4. קבוצות ----------
async function createGroups(users, homeOf) {
  const groupMembers = data.GROUPS.map(() => new Set())
  users.forEach((u) => {
    groupMembers[homeOf.get(String(u._id))].add(String(u._id))
    // כל אחד מצטרף גם ל-1 עד 3 קבוצות כלליות
    for (const g of pickMany(PUBLIC_EXTRA_GROUPS, randInt(1, 3))) groupMembers[g].add(String(u._id))
  })

  const groups = data.GROUPS.map((spec, i) => {
    // אם אין לקבוצה מספיק חברים - מכניסים כמה אקראיים
    if (groupMembers[i].size < 3) pickMany(users, 4).forEach((u) => groupMembers[i].add(String(u._id)))
    const members = [...groupMembers[i]]
    // בקשות הצטרפות שממתינות לאישור - רק בקבוצות פרטיות
    const outsiders = users.filter((u) => !groupMembers[i].has(String(u._id)))
    const pendingRequests = spec.privacy === 'private' ? pickMany(outsiders, randInt(1, 3)).map((u) => u._id) : []
    return { ...spec, admin: pick(members), members, pendingRequests, createdAt: daysAgo(randInt(240, 330)) }
  })
  return Group.insertMany(groups)
}

// ---------- 5. חברויות ובקשות חברות ----------
async function createFriendships(users, homeOf) {
  const friends = new Map(users.map((u) => [String(u._id), new Set()]))
  const connect = (a, b) => {
    if (a === b) return
    friends.get(a).add(b)
    friends.get(b).add(a)
  }
  for (const u of users) {
    const id = String(u._id)
    // רוב החברים מאותה יחידה, וכמה מבחוץ
    const sameUnit = users.filter((o) => homeOf.get(String(o._id)) === homeOf.get(id))
    pickMany(sameUnit, randInt(2, 4)).forEach((o) => connect(id, String(o._id)))
    pickMany(users, randInt(0, 2)).forEach((o) => connect(id, String(o._id)))
  }
  // בקשות חברות שעוד לא אושרו (נשמרות אצל מי שמקבל אותן)
  const requests = new Map(users.map((u) => [String(u._id), new Set()]))
  for (let i = 0; i < 15; i++) {
    const [a, b] = pickMany(users, 2).map((u) => String(u._id))
    if (!friends.get(a).has(b)) requests.get(b).add(a)
  }
  await User.bulkWrite(
    users.map((u) => ({
      updateOne: {
        filter: { _id: u._id },
        update: { friends: [...friends.get(String(u._id))], friendRequests: [...requests.get(String(u._id))] },
      },
    })),
  )
  return friends
}

// ---------- 6. פוסטים ----------
async function createPosts(users, groups, friends) {
  const groupsOf = (userId) => groups.filter((g) => g.isMember(userId))
  const salesGroup = groups.find((g) => g.name.startsWith('יד שנייה'))
  const posts = []
  for (let i = 0; i < POSTS_COUNT; i++) {
    const author = pick(users)
    const myGroups = groupsOf(author._id)
    const isSale = random() < 0.35
    // פוסט מכירה - לרוב בקבוצת יד שנייה (אם הכותב חבר בה)
    let group = null
    if (isSale && salesGroup.isMember(author._id) && random() < 0.6) group = salesGroup
    else if (random() < 0.8 && myGroups.length > 0) group = pick(myGroups)

    // התאריכים: יותר פוסטים בחודשים האחרונים (כדי שבגרף תראה מגמה)
    const age = Math.floor(Math.pow(random(), 1.6) * 240)
    const post = { author: author._id, group: group ? group._id : null, createdAt: daysAgo(age) }
    if (isSale) {
      const [text, min, max] = pick(data.SALE_POSTS)
      Object.assign(post, { type: 'sale', text, price: Math.round(randInt(min, max) / 10) * 10, sold: age > 30 && random() < 0.4 })
    } else {
      Object.assign(post, { type: 'regular', text: pick(data.REGULAR_POSTS) })
      if (random() < 0.04) post.videoUrl = pick(data.VIDEO_URLS)
    }
    // לייקים מאנשים שרואים את הפוסט (חברי הקבוצה, או החברים של הכותב)
    const audience = group ? group.members : [...friends.get(String(author._id))]
    post.likes = pickMany(audience, randInt(0, Math.min(12, audience.length)))
    posts.push(post)
  }
  return Post.insertMany(posts)
}

// ---------- 7. הודעות בצ'אט ----------
async function createMessages(users, friends) {
  const messages = []
  let conversations = 0
  for (const u of pickMany(users, 14)) {
    const myFriends = [...friends.get(String(u._id))]
    if (myFriends.length === 0) continue
    const other = new mongoose.Types.ObjectId(pick(myFriends))
    const lines = pick(data.CHAT_LINES)
    let time = daysAgo(randInt(0, 20)).getTime()
    lines.forEach((text, i) => {
      time += randInt(1, 30) * 60 * 1000
      const fromU = i % 2 === 0
      messages.push({
        from: fromU ? u._id : other,
        to: fromU ? other : u._id,
        text,
        read: i < lines.length - 1 || random() < 0.5, // ההודעה האחרונה לפעמים עוד לא נקראה
        createdAt: new Date(Math.min(time, Date.now())),
      })
    })
    conversations++
  }
  await Message.insertMany(messages)
  return { messages: messages.length, conversations }
}

async function seed() {
  if (!process.env.SEED_PASSWORD) {
    console.error('חסר SEED_PASSWORD בקובץ .env - הסיסמה של משתמשי הדוגמה (ראו .env.example)')
    process.exit(1)
  }
  await connectDB()

  const specs = buildUserSpecs()
  const removed = await removePreviousSeed(specs.map((u) => u.username))
  if (removed) console.log(`נמחקו ${removed} משתמשי דוגמה מהרצה קודמת`)

  const users = await createUsers(specs)
  const homeOf = new Map(users.map((u, i) => [String(u._id), specs[i].homeGroup]))
  const groups = await createGroups(users, homeOf)
  const friends = await createFriendships(users, homeOf)
  const posts = await createPosts(users, groups, friends)
  const chat = await createMessages(users, friends)

  console.log('נוצרו:')
  console.log(`  ${users.length} משתמשים (כולל מנהל האתר: admin)`)
  console.log(`  ${groups.length} קבוצות`)
  console.log(`  ${posts.length} פוסטים`)
  console.log(`  ${chat.messages} הודעות ב-${chat.conversations} שיחות`)
  console.log('הסיסמה של כל משתמשי הדוגמה: הערך של SEED_PASSWORD בקובץ .env')
  console.log('דוגמה לשם משתמש להתחברות:', users[0].username)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('ה-seed נכשל:', err.message)
  process.exit(1)
})
