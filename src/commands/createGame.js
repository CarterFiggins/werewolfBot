const { SlashCommandBuilder } = require("@discordjs/builders");
const { startGame } = require("../util/gameHelpers");
const { findGame } = require("../werewolf_db");
const { commandNames } = require("../util/commandHelpers");
const { isAdmin } = require("../util/rolesHelpers");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.CREATE_GAME)
    .setDescription("ADMIN COMMAND: creates the game"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () => !isAdmin(interaction.member),
    });

    if (deniedMessage) {
      await interaction.editReply({
        content: deniedMessage,
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

    try {
      await startGame(interaction);
    } catch (error) {
      await interaction.editReply({ content: error.message, ephemeral: true });
      return;
    }
    await interaction.editReply({ content: "Game Created", ephemeral: true });
  },
};
