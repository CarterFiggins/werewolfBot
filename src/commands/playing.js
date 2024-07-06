const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const {
  getRole,
  roleNames,
  isAlive,
  isPlaying,
  isDead,
} = require("../util/rolesHelpers");
const { playingResponse } = require("../util/playingHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.PLAYING)
    .setDescription("give the playing role to user"),

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
    await playingResponse(interaction);
  },
};
