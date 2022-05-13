const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { isAdmin } = require("../util/rolesHelpers");
const { timeScheduling } = require("../util/timeHelper");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.RESET_SCHEDULING)
    .setDescription("Reset the time schedulers for day and nigh time"),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        content: "You don't have the permissions to reset the time scheduling",
        ephemeral: true,
      });
      return;
    }

    const ok = await timeScheduling(interaction);
    if (!ok) {
      return;
    }
    await interaction.reply({
      content: "time scheduling reset",
      ephemeral: true,
    });
  },
};
