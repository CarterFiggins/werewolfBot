const { MongoClient } = require("mongodb");
require("dotenv").config();

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    await createCollections(client);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main();

async function createCollections(client) {
  // create users, votes, game
  const db = await client.db(process.env.MONGODB_NAME);

  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);
  if (!collectionNames.includes("users")) {
    await client.db().createCollection("users", {});
  }
  if (!collectionNames.includes("votes")) {
    await client.db().createCollection("votes", {});
  }
  if (!collectionNames.includes("games")) {
    await client.db().createCollection("games", {});
  }

  console.log("Data Base Ready!");
}
