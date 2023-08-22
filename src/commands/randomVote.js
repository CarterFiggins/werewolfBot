const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { channelNames, getRandomBotGif } = require("../util/channelHelpers");
const { roleNames, isAlive } = require("../util/rolesHelpers");
const { findGame, upsertVote, findUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { getAliveMembers } = require("../util/discordHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.RANDOM_VOTE)
    .setDescription("randomly vote for a user"),
  async execute(interaction) {
    const deniedMessage = await permissionCheck({
      interaction,
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

    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const aliveMembers = await getAliveMembers(interaction, false)
    const votedMember = _.sample(aliveMembers)
    const mapRoles = votedMember.roles.cache;
    const roles = mapRoles.map((role) => {
      return role.name;
    });

    console.log(votedMember.user.username)

    const dbUser = await findUser(interaction.user.id, interaction.guild.id);

    if (channel.name !== channelNames.TOWN_SQUARE) {
      await interaction.reply({
        content:
          "Use vote in the town-square so everyone can see\nhttps://tenor.com/3LlN.gif",
        ephemeral: true,
      });
      return;
    }
    if (dbUser.is_dead) {
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

    await upsertVote(interaction.user.id, interaction.guild.id, {
      guild_id: interaction.guild.id,
      user_id: interaction.user.id,
      username: interaction.user.username,
      voted_user_id: votedMember.id,
      voted_username: votedMember.user.username,
    });

    await interaction.reply(`${interaction.user} has decided to let me vote. I voted for ${votedMember}`);
  },
};
