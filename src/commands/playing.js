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
    const member = interaction.member;
    if (isAlive(member) || isPlaying(member) || isDead(member)) {
      await interaction.reply({
        content: "You are already Playing",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const playingRole = await getRole(interaction, roleNames.PLAYING);
    member.roles.add(playingRole);

    await interaction.editReply({
      content: `${interaction.user} is now playing`,
    });
  },
};
