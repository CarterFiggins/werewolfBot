const { SlashCommandBuilder } = require("@discordjs/builders");
const { getRole, roleNames } = require("../util/gameHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playing")
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
