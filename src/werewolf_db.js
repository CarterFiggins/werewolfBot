const db = require("./mongoUtil").getDb();

async function deleteAllUsers() {
  await db.collection("user").deleteMany({});
}

async function findUser(user_id) {
  return await db.collection("user").findOne({ user_id });
}

async function updateUser(user_id, updatedUser) {
  await db.collection("user").updateOne({ user_id }, { $set: updatedUser });
}

async function createUsers(newUsers) {
  await db.collection("user").insertMany(newUsers);
}

module.exports = {
  deleteAllUsers,
  findUser,
  updateUser,
  createUsers,
};
