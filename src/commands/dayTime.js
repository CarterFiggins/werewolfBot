const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { dayTimeJob } = require("../util/timeHelper");
const { findGame } = require("../werewolf_db");
const { isAdmin } = require("../util/rolesHelpers");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.DAY_TIME)
    .setDescription("ADMIN COMMAND: Runs the day job"),
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

    const game = await findGame(interaction.guild.id);
    if (!game) {
      await interaction.editReply({
        content: "ERROR: no game is active",
        ephemeral: true,
      });
      return;
    }
    if (game.is_day) {
      await interaction.editReply({
        content: "Already day",
        ephemeral: true,
      });
      return;
    }
    await dayTimeJob(interaction);
    await interaction.editReply({
      content: "Day job ran",
      ephemeral: true,
    });
  },
};
