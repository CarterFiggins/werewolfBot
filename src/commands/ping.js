const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
  async execute(interaction) {
    console.log("I MADE IT TO PONG!")
		await interaction.reply('Pong!');
	},
};