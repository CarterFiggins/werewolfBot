const db = require("./mongoUtil").getDb();

async function deleteAllUsers(guild_id) {
  await db.collection("users").deleteMany({ guild_id });
}

async function findUser(user_id, guild_id) {
  return await db.collection("users").findOne({ user_id, guild_id });
}

async function findOneUser(where) {
  return await db.collection("users").findOne(where);
}

async function findManyUsers(where) {
  return await db.collection("users").find(where);
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

async function findUsersWithIds(guild_id, user_ids) {
  return await db.collection("users").aggregate([
    {
      $match: {
        guild_id: guild_id,
        user_id: { $in: user_ids },
      },
    },
  ]);
}

async function updateUser(user_id, guild_id, updatedUser) {
  await db
    .collection("users")
    .updateOne({ user_id, guild_id }, { $set: updatedUser });
}

async function updateManyUsers(where, updatedUser) {
  await db
    .collection("users")
    .updateOne({ where }, { $set: updatedUser });
}


async function resetUserWhisperCount(guild_id) {
  await db
    .collection("users")
    .updateMany({ guild_id, is_dead: false }, { $set: { whisper_count: 0 } });
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

async function findManyVotes(where) {
  return await db.collection("votes").find(where);
}

async function deleteManyVotes(where) {
  await db.collection("votes").deleteMany(where);
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

async function findAllGames() {
  const cursor = await db.collection("games").find();
  return cursor.toArray();
}

async function updateGame(guild_id, updatedGame) {
  return await db
    .collection("games")
    .updateOne({ guild_id }, { $set: updatedGame });
}

async function deleteGame(guild_id) {
  return await db.collection("games").deleteOne({ guild_id });
}

async function findSettings(guild_id) {
  return await db.collection("settings").findOne({ guild_id });
}

async function createSettings(newSettings) {
  return await db.collection("settings").insertOne(newSettings);
}

async function updateSettings(guild_id, updatedSettings) {
  return await db
    .collection("settings")
    .updateOne({ guild_id }, { $set: updatedSettings });
}

async function updateAdminSettings(guild_id, settings) {
  return await db.collection("adminSettings").updateOne(
    { guild_id },
    { $set: settings },
    { upsert: true }
  );
}

async function findAdminSettings(guild_id) {
  return  await db
    .collection("adminSettings")
    .findOne({ guild_id });
}

module.exports = {
  deleteAllUsers,
  findUser,
  findOneUser,
  findManyUsers,
  findAllUsers,
  findUsersWithIds,
  updateUser,
  updateManyUsers,
  createUsers,
  upsertVote,
  getCountedVotes,
  deleteManyVotes,
  findManyVotes,
  createGame,
  findGame,
  findAllGames,
  updateGame,
  deleteGame,
  findSettings,
  createSettings,
  updateSettings,
  resetUserWhisperCount,
  findAdminSettings,
  updateAdminSettings,
}
