const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { channelNames, getRandomBotGif } = require("../util/channelHelpers");
const { roleNames, isAlive } = require("../util/rolesHelpers");
const { findGame, upsertVote, findUser, deleteManyVotes } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.VOTE)
    .setDescription("vote for a user")
    .addUserOption((option) =>
      option
        .setName("voted")
        .setDescription("name of player to vote off")
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild.id);
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

    const votedUser = interaction.options.getUser("voted");

    if (!votedUser) {
      await deleteManyVotes({
        guild_id: interaction.guild.id,
        user_id: interaction.user.id,
      });
      await interaction.reply(`${interaction.user} has removed their vote.`);
      return;
    }

    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const votedMember = interaction.guild.members.cache.get(votedUser.id);
    const mapRoles = votedMember.roles.cache;
    const roles = mapRoles.map((role) => {
      return role.name;
    });

    const votedDbUser = await findUser(votedUser.id, interaction.guild.id);

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
        ephemeral: false,
      });
      return;
    }
    if (votedUser.bot) {
      await interaction.reply({
        content: `You can't vote for me!\n${getRandomBotGif()}`,
        ephemeral: false,
      });
      return;
    }
    if (!roles.includes(roleNames.ALIVE)) {
      await interaction.reply({
        content: `You voted for ${votedUser} who is dead. Try again.`,
        ephemeral: false,
      });
      return;
    }
    if (votedDbUser.is_muted) {
      await interaction.reply({
        content: `${votedUser} is safely locked away in the Granny's house. They will not be here for the hanging and can not be voted.`,
        ephemeral: true,
      });
      return;
    }

    await upsertVote(interaction.user.id, interaction.guild.id, {
      guild_id: interaction.guild.id,
      user_id: interaction.user.id,
      username: interaction.user.username,
      voted_user_id: votedUser.id,
      voted_username: votedUser.username,
    });

    await interaction.reply(`${interaction.user} has voted for ${votedUser}`);
  },
};
