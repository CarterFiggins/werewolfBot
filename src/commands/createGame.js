const { SlashCommandBuilder } = require("@discordjs/builders");
const { startGame } = require("../util/gameHelpers");
const { findGame } = require("../werewolf_db");
const { commandNames } = require("../util/commandHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.CREATE_GAME)
    .setDescription("creates the game"),
  async execute(interaction) {
    const currentGame = await findGame(interaction.guild.id);
    if (currentGame) {
      await interaction.reply({
        content: "There is already a game happening",
        ephemeral: true,
      });
      return;
    }

    const ok = await startGame(interaction);
    // error message was sent
    if (!ok) {
      return;
    }
    await interaction.reply({ content: "Game Created", ephemeral: true });
  },
};
