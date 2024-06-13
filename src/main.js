require("dotenv").config();
const mongoUtil = require("./mongoUtil");
const fs = require("fs");
const { Client, Collection, GatewayIntentBits } = require("discord.js");

mongoUtil.connectToServer(function (err, mongoClient) {
  if (err) console.log(err);
  console.log("connected to Mongo DB");

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
    ],
    partials: ["CHANNEL"],
  });

  client.commands = createHandler('commands')
  client.selectMenus = createHandler('selectMenus')
  client.buttons = createHandler('buttons')

  // **************************
  // ***** Event Handling *****
  // **************************
  const eventFiles = fs
    .readdirSync("./src/events")
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
  // *****************************
  // *****************************

  client.login(process.env.TOKEN);
});

function createHandler(handlerName) {
  const collection = new Collection();
  const files = fs
    .readdirSync(`./src/${handlerName}`)
    .filter((file) => file.endsWith(".js"));

  for (const file of files) {
    const handler = require(`./${handlerName}/${file}`);
    collection.set(handler.data.name, handler);
  }
  return collection;
}
