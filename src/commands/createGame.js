const { SlashCommandBuilder } = require("@discordjs/builders");
const { startGame } = require("../util/gameHelpers");
const { findGame } = require("../werewolf_db");
const { commandNames } = require("../util/commandHelpers");
const { isAdmin } = require("../util/rolesHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.CREATE_GAME)
    .setDescription("creates the game"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!isAdmin(interaction.member)) {
      await interaction.editReply({
        content: "You don't have the permissions to create a game",
        ephemeral: true,
      });
      return;
    }

    const currentGame = await findGame(interaction.guild.id);
    if (currentGame) {
      await interaction.editReply({
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
    await interaction.editReply({ content: "Game Created", ephemeral: true });
  },
};
