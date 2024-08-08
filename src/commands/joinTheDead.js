const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { joinTheDeadResponse } = require("../util/changeRoleHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.JOIN_THE_DEAD)
    .setDescription("Join the dead when a game has already started"),

  async execute(interaction) {
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }
    await joinTheDeadResponse(interaction);
  },
};
