const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { getRole, roleNames } = require("../util/rolesHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.STOP_PLAYING)
    .setDescription("removes the playing role from the user"),

  async execute(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const playingRole = await getRole(interaction, roleNames.PLAYING);
    member.roles.remove(playingRole);

    await interaction.reply({
      content: `${interaction.user.username} has removed themselves from playing`,
    });
  },
};
