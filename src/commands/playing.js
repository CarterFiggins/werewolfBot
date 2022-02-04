const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { getRole, roleNames } = require("../util/rolesHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.PLAYING)
    .setDescription("give the playing role to user"),

  async execute(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const playingRole = await getRole(interaction, roleNames.PLAYING);
    member.roles.add(playingRole);

    await interaction.reply({
      content: `${interaction.user.username} is now playing`,
    });
  },
};
