const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { dayTimeJob } = require("../util/timeHelper");
const schedule = require("node-schedule");
const { findGame } = require("../werewolf_db");
const { isAdmin } = require("../util/rolesHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.DAY_TIME)
    .setDescription("Runs the day job"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!isAdmin(interaction.member)) {
      await interaction.editReply({
        content: "You don't have the permissions to make it day time",
        ephemeral: true,
      });
      return;
    }

    const game = await findGame(interaction.guild.id);
    if (!game) {
      await interaction.reply({
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
