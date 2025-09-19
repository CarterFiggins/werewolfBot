const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { isAdmin, getRole, roleNames } = require("../util/rolesHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { alreadyPlayingReplay } = require("../util/changeRoleHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.FORCE_PLAYING)
    .setDescription("ADMIN COMMAND: force player to play")
    .addUserOption((option) =>
      option
        .setName("player")
        .setDescription("name of player to force to play")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () => !isAdmin(interaction.member),
    });

    if (deniedMessage) {
      await interaction.editReply({
        content: deniedMessage,
      });
      return;
    }

    const discordUser = await interaction.options.getUser("player");
    const discordMember = interaction.guild.members.cache.get(discordUser.id);
    await discordMember.fetch();

    if (await alreadyPlayingReplay(interaction, discordMember, "Player already playing")) return;

    const playingRole = await getRole(interaction, roleNames.PLAYING);
    await discordMember.roles.add(playingRole);
    await interaction.editReply({ content: `${discordMember} is now playing` });
  },
};
