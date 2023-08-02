const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames, characters  } = require("../util/commandHelpers");
const { getRandomBotGif, channelNames } = require("../util/channelHelpers");
const { roleNames, isAlive } = require("../util/rolesHelpers");
const { findGame, findUser, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { removePermissionsFromKick } = require("../util/characterHelpers/grouchyGranny");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.KICK)
    .setDescription("kick a user out of the village for a day")
    .addUserOption((option) =>
      option
        .setName("kicked")
        .setDescription("name of player to kick off")
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

    const kickedUser = interaction.options.getUser("kicked");
    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const votedMember = interaction.guild.members.cache.get(kickedUser.id);
    const mapRoles = votedMember.roles.cache;
    const roles = mapRoles.map((role) => {
      return role.name;
    });

    if (channel.name !== channelNames.TOWN_SQUARE) {
      await interaction.reply({
        content:
          "Use kick in the town-square",
        ephemeral: true,
      });
      return;
    }
    if (game.first_night) {
      await interaction.reply({
        content:
          "Can't kick before the first night wait until tomorrow\nhttps://tenor.com/VZNU.gif",
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
    if (kickedUser.bot) {
      await interaction.reply({
        content: `You can't kick me!\n${getRandomBotGif()}`,
        ephemeral: true,
      });
      return;
    }
    if (!roles.includes(roleNames.ALIVE)) {
      await interaction.reply({
        content: `${kickedUser} can not be kicked. They are either dead or not playing this round`,
        ephemeral: true,
      });
      return;
    }
    if (kickedUser.id === interaction.user.id) { 
      await interaction.reply({
        content: `Stop kicking yourself! try again!`,
        ephemeral: true,
      });
      return;
    }

    await updateUser(interaction.user.id, interaction.guild.id, {
      hasKicked: true,
    });
    await updateUser(kickedUser.id, interaction.guild.id, {
      isKicked: true,
    });

    await removePermissionsFromKick(interaction, kickedUser)

    await channel.send(`Grouchy Granny has kicked out ${kickedUser}. They will be back tomorrow`)
    // TODO: remove vote?

    await interaction.reply({
      content: `successfully kicked ${kickedUser}`,
      ephemeral: true,
    });
  },
};
