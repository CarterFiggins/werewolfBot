const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { nightTimeJob } = require("../util/timeHelper");
const { findGame } = require("../werewolf_db");
const { isAdmin } = require("../util/rolesHelpers");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.NIGHT_TIME)
    .setDescription("ADMIN COMMAND: Runs the night job"),
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
    if (!game.is_day) {
      await interaction.editReply({
        content: "Already night",
        ephemeral: true,
      });
      return;
    }
    await nightTimeJob(interaction);

    await interaction.editReply({
      content: "Night job ran",
      ephemeral: true,
    });
  },
};
