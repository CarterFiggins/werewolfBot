const db = require("./mongoUtil").getDb();

async function deleteAllUsers() {
  await db.collection("user").deleteMany({});
}

async function findUser(user_id) {
  return await db.collection("user").findOne({ user_id });
}

async function updateUser(user_id, updatedUser) {
  const result = await db
    .collection("user")
    .updateOne({ user_id }, { $set: updatedUser });
  console.log(`${result.matchedCount} document(s) matched the query criteria`);
  console.log(`${result.modifiedCount} documents was/were updated`);
}

async function createUsers(newUsers) {
  console.log(newUsers);
  await db.collection("user").insertMany(newUsers);
}

module.exports = {
  deleteAllUsers,
  findUser,
  updateUser,
  createUsers,
};
