const { MongoClient } = require("mongodb");
require("dotenv").config();

var _db;

module.exports = {
  connectToServer: async function (callback) {
    await MongoClient.connect(
      process.env.MONGO_URI,
      {
        keepAlive: true,
      },
      (err, mongoClient) => {
        _db = mongoClient.db("Werewolf");
        return callback(err);
      }
    );
  },

  getDb: function () {
    return _db;
  },
};
