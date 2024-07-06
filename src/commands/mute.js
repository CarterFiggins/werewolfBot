const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil")
const { getRandomBotGif, channelNames } = require("../util/channelHelpers");
const { roleNames, isAlive } = require("../util/rolesHelpers");
const { findGame, findUser, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.MUTE)
    .setDescription("mute a user out of the village for a day")
    .addUserOption((option) =>
      option
        .setName("muted")
        .setDescription("name of player to mute")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () => !isAlive(interaction.member) || dbUser.character !== characters.GROUCHY_GRANNY,
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const muteUser = interaction.options.getUser("muted");
    const mutedDbUser = await findUser(muteUser.id, interaction.guild.id);
    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const votedMember = interaction.guild.members.cache.get(muteUser.id);
    const mapRoles = votedMember.roles.cache;
    const roles = mapRoles.map((role) => {
      return role.name;
    });

    if (channel.name !== channelNames.OUT_CASTS) {
      await interaction.reply({
        content:
          "Use mute in the out_casts channel",
        ephemeral: true,
      });
      return;
    }
    if (game.is_day) {
      await interaction.reply({
        content:
          "It is day time. You can only mute at night",
        ephemeral: true,
      });
      return;
    }
    if (muteUser.bot) {
      await interaction.reply({
        content: `You can't mute me!\n${getRandomBotGif()}`,
        ephemeral: true,
      });
      return;
    }
    if (!roles.includes(roleNames.ALIVE)) {
      await interaction.reply({
        content: `${muteUser} can not be muted. They are either dead or not playing this round`,
        ephemeral: true,
      });
      return;
    }
    if (muteUser.id === interaction.user.id) { 
      await interaction.reply({
        content: `Stop muting yourself! try again!`,
        ephemeral: false,
      });
      return;
    }
    if (mutedDbUser.isMuted === true) { 
      await interaction.reply({
        content: `Player currently muted`,
        ephemeral: false,
      });
      return;
    }
    if (mutedDbUser.safeFromMutes === true) { 
      await interaction.reply({
        content: `Player has already been muted this game. Try again`,
        ephemeral: false,
      });
      return;
    }


    await updateUser(interaction.user.id, interaction.guild.id, {
      muteUserId: muteUser.id
    })

    await interaction.reply({
      content: `You are going to mute ${muteUser}`,
      ephemeral: false,
    });
  },
};
