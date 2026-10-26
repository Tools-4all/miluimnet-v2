// שכבת services לקבוצות: מחיקת קבוצה וכל מה שקשור אליה
const Group = require('../models/Group')
const Post = require('../models/Post')

async function deleteGroupData(groupIds) {
  const ids = [].concat(groupIds) // מקבל id אחד או מערך
  await Post.deleteMany({ group: { $in: ids } }) // הפוסטים של הקבוצה נמחקים איתה
  await Group.deleteMany({ _id: { $in: ids } })
}

module.exports = { deleteGroupData }
