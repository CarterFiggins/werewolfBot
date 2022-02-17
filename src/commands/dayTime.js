const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { dayTimeJob } = require("../util/timeHelper");
const schedule = require("node-schedule");
const { findGame } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.DAY_TIME)
    .setDescription("Runs the day job"),
  async execute(interaction) {
    await schedule.gracefulShutdown();
    await interaction.deferReply({ ephemeral: true });
    const game = await findGame(interaction.guild.id);
    if (!game) {
      await interaction.reply({
        content: "ERROR: no game is active",
        ephemeral: true,
      });
      return;
    }
    if (game.is_day) {
      await interaction.reply({
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
