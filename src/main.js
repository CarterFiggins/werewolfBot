require("dotenv").config();
const fs = require('fs');
const { Client, Collection, Intents } = require("discord.js");
const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"],
  partials: ["CHANNEL"],
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.on('ready', () => {
  console.log(`bot ready as ${client.user.tag}`);
});

client.once('ready', () => {
  console.log(`bot ready as ${client.user.tag}`);
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
	const command = client.commands.get(interaction.commandName);
  
	if (!command) return;
  console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.on("messageCreate", (message) => {
  if (message.author.bot) {
    return;
  }
  if (message.content === "hello") {
    message.channel.send("I AM ALIVE");
  }
});

client.login(process.env.TOKEN);
