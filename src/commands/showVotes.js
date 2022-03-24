const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { getCountedVotes, findManyVotes } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("show")
    .setDescription("show voting info")
    .addSubcommand((subcommand) =>
      subcommand
        .setName(commandNames.SHOW_VOTES)
        .setDescription("shows votes for players")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(commandNames.SHOW_VOTERS_FOR)
        .setDescription("see who if voting for player")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("The player people are voting for")
        )
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    if (interaction.options.getSubcommand() === commandNames.SHOW_VOTES) {
      const cursor = await getCountedVotes(interaction.guild.id);
      const allVotes = await cursor.toArray();
      if (_.isEmpty(allVotes)) {
        await interaction.editReply({
          content: "There are no votes to be counted",
          ephemeral: false,
        });
        return;
      }

      let message = "";

      await Promise.all(
        _.map(allVotes, async (vote) => {
          const member = await interaction.guild.members.fetch(
            vote._id.voted_user_id
          );
          message += `${member}: ${vote.count} votes\n`;
        })
      );

      await interaction.editReply({
        content: `Current Votes\n${message}`,
        ephemeral: false,
      });
    }
    if (interaction.options.getSubcommand() === commandNames.SHOW_VOTERS_FOR) {
      const targetUser = interaction.options.getUser("target");
      const members = await interaction.guild.members.fetch();
      const guildId = interaction.guild.id;
      let cursorVotes = null;
      if (targetUser) {
        cursorVotes = await findManyVotes({
          guild_id: guildId,
          voted_user_id: targetUser.id,
        });
      } else {
        cursorVotes = await findManyVotes({
          guild_id: guildId,
        });
      }

      const votedForMap = new Map();
      const usersIdsOnVoterBoard = [];

      const votes = await cursorVotes.toArray();

      _.forEach(votes, (vote) => {
        let votedFor = votedForMap.get(vote.voted_user_id);
        if (votedFor) {
          votedForMap.set(vote.voted_user_id, [
            ...votedFor,
            members.get(vote.user_id),
          ]);
        } else {
          votedForMap.set(vote.voted_user_id, [members.get(vote.user_id)]);
          usersIdsOnVoterBoard.push(vote.voted_user_id);
        }
      });

      let message = "";

      _.forEach(usersIdsOnVoterBoard, (userId) => {
        message += `Players voting for ${members.get(userId)}\n`;
        _.forEach(votedForMap.get(userId), (member) => {
          message += `  ${member}\n`;
        });
      });

      await interaction.editReply({
        content: message || "No Votes to be found",
        ephemeral: false,
      });
    }
  },
};
