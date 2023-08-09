const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames, characters  } = require("../util/commandHelpers");
const { getRandomBotGif, channelNames } = require("../util/channelHelpers");
const { roleNames, isAlive } = require("../util/rolesHelpers");
const { findGame, findUser, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { castOutUser } = require("../util/characterHelpers/grouchyGranny");

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

    const mutedUser = interaction.options.getUser("muted");
    const mutedDbUser = await findUser(mutedUser.id, interaction.guild.id);
    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const votedMember = interaction.guild.members.cache.get(mutedUser.id);
    const mapRoles = votedMember.roles.cache;
    const roles = mapRoles.map((role) => {
      return role.name;
    });

    if (channel.name !== channelNames.TOWN_SQUARE) {
      await interaction.reply({
        content:
          "Use mute in the town-square",
        ephemeral: true,
      });
      return;
    }
    if (game.first_night) {
      await interaction.reply({
        content:
          "Can't mute before the first night wait until tomorrow\nhttps://tenor.com/VZNU.gif",
        ephemeral: true,
      });
      return;
    }
    if (!game.is_day) {
      await interaction.reply({
        content:
          "It is night time. You are old and need sleep\nhttps://tenor.com/view/angry-grandpa-funny-im-old-and-i-need-sleep-gif-13658228",
        ephemeral: true,
      });
      return;
    }
    if (mutedUser.bot) {
      await interaction.reply({
        content: `You can't mute me!\n${getRandomBotGif()}`,
        ephemeral: true,
      });
      return;
    }
    if (!roles.includes(roleNames.ALIVE)) {
      await interaction.reply({
        content: `${mutedUser} can not be muted. They are either dead or not playing this round`,
        ephemeral: true,
      });
      return;
    }
    if (mutedUser.id === interaction.user.id) { 
      await interaction.reply({
        content: `Stop muting yourself! try again!`,
        ephemeral: true,
      });
      return;
    }
    if (mutedDbUser.isMuted === true) { 
      await interaction.reply({
        content: `Player already muted`,
        ephemeral: true,
      });
      return;
    }
    if (mutedDbUser.safeFromMutes === true) { 
      await interaction.reply({
        content: `Player is safe from mutes. Go mute someone else`,
        ephemeral: true,
      });
      return;
    }


    await updateUser(interaction.user.id, interaction.guild.id, {
      hasMuted: true,
    });
    await updateUser(mutedUser.id, interaction.guild.id, {
      isMuted: true,
    });

    await castOutUser(interaction, mutedUser)

    await channel.send(`Grouchy Granny has muted ${mutedUser}. They can talk tomorrow`)

    await interaction.reply({
      content: `successfully muted ${mutedUser}`,
      ephemeral: true,
    });
  },
};
