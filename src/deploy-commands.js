const fs = require("fs");
const path = require("path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();

async function deployCommands() {
  const { TOKEN, CLIENT_ID } = process.env;

  const commands = [];
  const commandFiles = fs
    .readdirSync(path.join(__dirname, "commands"))
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "9" }).setToken(TOKEN);

  console.log("Started refreshing application (/) commands.");

  // Set Global Commands sometimes takes a hour to update
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

  console.log("Successfully reloaded application (/) commands.");
}

if (require.main === module) {
  deployCommands().catch((error) => console.error(error));
}

module.exports = { deployCommands };
