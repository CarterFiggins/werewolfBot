const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { channelNames, getRandomBotGif } = require("../util/channelHelpers");
const { roleNames } = require("../util/rolesHelpers");
const { findGame, upsertVote, findUser } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.VOTE)
    .setDescription("vote for a user")
    .addUserOption((option) =>
      option
        .setName("voted")
        .setDescription("name of player to vote off")
        .setRequired(true)
    ),
  async execute(interaction) {
    const votedUser = interaction.options.getUser("voted");
    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const votedMember = interaction.guild.members.cache.get(votedUser.id);
    const mapRoles = votedMember.roles.cache;
    const roles = mapRoles.map((role) => {
      return role.name;
    });

    const dbUser = await findUser(interaction.user.id, interaction.guild.id);

    if (channel.name !== channelNames.TOWN_SQUARE) {
      await interaction.reply({
        content:
          "Use vote in the town-square so everyone can see\nhttps://tenor.com/3LlN.gif",
        ephemeral: true,
      });
      return;
    }
    if (dbUser.death) {
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
        content:
          "You voted for someone that is not alive try again\nhttps://tenor.com/blWe0.gif",
        ephemeral: false,
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
