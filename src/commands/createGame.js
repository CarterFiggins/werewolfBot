const { SlashCommandBuilder } = require("@discordjs/builders");
const { startGame } = require("../util/gameHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("creates the game"),
  async execute(interaction) {
    await startGame(interaction);
    await interaction.reply({ content: "Game Created", ephemeral: true });
  },
};
