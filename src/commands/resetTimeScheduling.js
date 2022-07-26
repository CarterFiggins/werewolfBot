const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { isAdmin } = require("../util/rolesHelpers");
const { timeScheduling } = require("../util/timeHelper");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.RESET_SCHEDULING)
    .setDescription(
      "ADMIN COMMAND: Reset the time schedulers for day and nigh time"
    ),
  async execute(interaction) {
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () => !isAdmin(interaction.member),
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
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
