const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { channelNames, getRandomBotGif } = require("../util/channelHelpers");
const { roleNames, isAlive } = require("../util/rolesHelpers");
const { findGame, upsertVote, findUser, findManyUsers } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { getAliveMembers } = require("../util/discordHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.RANDOM_VOTE)
    .setDescription("randomly vote for a user"),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const dbUser = await findUser(interaction.user.id, guildId);
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () => !isAlive(interaction.member),
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const members = await interaction.guild.members.fetch();
    const game = await findGame(guildId);

    const cursorAlivePlayers = await findManyUsers({
      guild_id: guildId,
      is_dead: false,
      is_muted: { $ne: true },
    });

    const aliveDbUsers = await cursorAlivePlayers.toArray();
    const votedDbUser = _.sample(aliveDbUsers);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const votedMember = members.get(votedDbUser.user_id)
    const mapRoles = votedMember.roles.cache;
    const roles = mapRoles.map((role) => {
      return role.name;
    });

    

    if (channel.name !== channelNames.TOWN_SQUARE) {
      await interaction.reply({
        content:
          "Use vote in the town-square so everyone can see\nhttps://tenor.com/3LlN.gif",
        ephemeral: true,
      });
      return;
    }
    if (dbUser.is_injured) {
      await interaction.reply({
        content: "You can't vote because you are injured",
        ephemeral: true,
      });
      return;
    }
    if (game.first_night) {
      await interaction.reply({
        content:
          "Can't vote before the first night wait until tomorrow\nhttps://tenor.com/VZNU.gif",
        ephemeral: true,
      });
      return;
    }
    if (!game.is_day) {
      await interaction.reply({
        content:
          "It is night time. Get some rest and vote tomorrow\nhttps://tenor.com/bFIfb.gif",
        ephemeral: true,
      });
      return;
    }
    if (votedMember.user.bot) {
      await interaction.reply({
        content: `You can't vote for me!\n${getRandomBotGif()}`,
        ephemeral: false,
      });
      return;
    }
    if (!roles.includes(roleNames.ALIVE)) {
      await interaction.reply({
        content: `You voted for ${votedMember} who is dead. Try again.`,
        ephemeral: false,
      });
      return;
    }

    await upsertVote(interaction.user.id, guildId, {
      guild_id: guildId,
      user_id: interaction.user.id,
      username: interaction.user.username,
      voted_user_id: votedMember.id,
      voted_username: votedMember.user.username,
    });

    await interaction.reply(`${interaction.user} has decided to let me vote. I voted for ${votedMember}`);
  },
};
