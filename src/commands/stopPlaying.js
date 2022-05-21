const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { getRole, roleNames, isPlaying } = require("../util/rolesHelpers");

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

    const member = interaction.member;
    if (isPlaying(member)) {
      const playingRole = await getRole(interaction, roleNames.PLAYING);
      member.roles.remove(playingRole);

      await interaction.reply({
        content: `${interaction.user.username} has removed themselves from playing`,
      });
    } else {
      await interaction.reply({
        content: "Permission denied",
        ephemeral: true,
      });
      return;
    }
  },
};
