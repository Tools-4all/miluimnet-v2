// שכבת services לקבוצות: מחיקת קבוצה וכל מה שקשור אליה.
// (בסשן הפוסטים יתווסף כאן: מחיקת הפוסטים של הקבוצה)
const Group = require('../models/Group')

async function deleteGroupData(groupIds) {
  const ids = [].concat(groupIds) // מקבל id אחד או מערך
  await Group.deleteMany({ _id: { $in: ids } })
}

module.exports = { deleteGroupData }
