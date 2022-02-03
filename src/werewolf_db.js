const db = require("./mongoUtil").getDb();

async function deleteAllUsers(guild_id) {
  await db.collection("users").deleteMany({ guild_id });
}

async function findUser(user_id, guild_id) {
  return await db.collection("users").findOne({ user_id, guild_id });
}

async function findAllUsers(guild_id) {
  return await db.collection("users").aggregate([
    {
      $match: {
        guild_id: guild_id,
      },
    },
  ]);
}

async function updateUser(user_id, guild_id, updatedUser) {
  await db
    .collection("users")
    .updateOne({ user_id, guild_id }, { $set: updatedUser });
}

async function createUsers(newUsers) {
  await db.collection("users").insertMany(newUsers);
}

async function upsertVote(user_id, guild_id, updatedVote) {
  db.collection("votes").updateOne(
    { user_id, guild_id },
    { $set: updatedVote },
    { upsert: true }
  );
}

async function deleteAllVotes(guild_id) {
  await db.collection("votes").deleteMany({ guild_id });
}

async function getCountedVotes(guild_id) {
  return await db.collection("votes").aggregate([
    {
      $match: {
        guild_id: guild_id,
      },
    },
    {
      $group: {
        _id: { voted_user_id: "$voted_user_id" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);
}

async function createGame(newGame) {
  await db.collection("games").insertOne(newGame);
}

async function findGame(guild_id) {
  return await db.collection("games").findOne({ guild_id });
}

async function updateGame(guild_id, updatedGame) {
  return await db
    .collection("games")
    .updateOne({ guild_id }, { $set: updatedGame });
}

async function deleteGame(guild_id) {
  return await db.collection("games").deleteOne({ guild_id });
}

module.exports = {
  deleteAllUsers,
  findUser,
  findAllUsers,
  updateUser,
  createUsers,
  upsertVote,
  getCountedVotes,
  deleteAllVotes,
  createGame,
  findGame,
  updateGame,
  deleteGame,
};
