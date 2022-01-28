const { SlashCommandBuilder } = require("@discordjs/builders");
const { getRole, roleNames } = require("../util/gameHelpers");
const { commandNames } = require("../util/commandHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.STOP_PLAYING)
    .setDescription("give the playing role to user"),

  async execute(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const playingRole = await getRole(interaction, roleNames.PLAYING);
    member.roles.remove(playingRole);

    await interaction.reply({
      content: `${interaction.user.username} has removed themselves from playing`,
    });
  },
};
