const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { stopPlayingResponse } = require("../util/changeRoleHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.STOP_PLAYING)
    .setDescription("removes the playing role from the user"),

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

    await stopPlayingResponse(interaction);
  },
};
