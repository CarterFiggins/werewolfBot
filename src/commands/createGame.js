const { SlashCommandBuilder } = require("@discordjs/builders");
const { startGame } = require("../util/gameHelpers");
const { commandNames } = require("../util/commandHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.CREATE_GAME)
    .setDescription("creates the game"),
  async execute(interaction) {
    await startGame(interaction);
    await interaction.reply({ content: "Game Created", ephemeral: true });
  },
};
