const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { nightTimeJob } = require("../util/timeHelper");
const schedule = require("node-schedule");
const { findGame } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.NIGHT_TIME)
    .setDescription("Runs the night job"),
  async execute(interaction) {
    await schedule.gracefulShutdown();
    const game = await findGame(interaction.guild.id);
    if (!game) {
      await interaction.reply({
        content: "ERROR: no game is active",
        ephemeral: true,
      });
      return;
    }
    if (!game.is_day) {
      await interaction.reply({
        content: "Already night",
        ephemeral: true,
      });
      return;
    }
    await nightTimeJob(interaction);

    await interaction.reply({
      content: "Night job ran",
      ephemeral: true,
    });
  },
};
