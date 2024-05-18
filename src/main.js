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

  // ****************************
  // ***** Command Handling *****
  // ****************************
  client.commands = new Collection();
  const commandFiles = fs
    .readdirSync("./src/commands")
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
  }
  // ****************************
  // *** Select Menu Handling ***
  // ****************************
  client.selectMenus = new Collection();
  const menuFiles = fs
  .readdirSync("./src/menus")
  .filter((file) => file.endsWith(".js"));
  for (const file of menuFiles) {
    const menu = require(`./menus/${file}`);
    client.selectMenus.set(menu.name, menu);
  }
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
