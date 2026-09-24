const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { getCountedVotes, findManyVotes, findGame, findSettings } = require("../werewolf_db");
const { fetchMember } = require("../util/discordHelpers");

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

    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
    });

    if (deniedMessage) {
      await interaction.editReply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const game = await findGame(interaction.guild.id);
    const settings = await findSettings(interaction.guild.id);
    const isMayorElection = settings.mayor_election && game.first_night;
    const isAnonymousVote = settings.anonymous_voting && !isMayorElection;
    const isSecretVote = isMayorElection || isAnonymousVote;

    if (interaction.options.getSubcommand() === commandNames.SHOW_VOTES) {
      if (isSecretVote) {
        const secretLabel = isMayorElection
          ? "🎩 Mayor votes are secret and won't be revealed."
          : "🕵️ Voting is anonymous and won't be revealed.";
        const cursor = await findManyVotes({ guild_id: interaction.guild.id });
        const votes = await cursor.toArray();
        await interaction.editReply({
          content: `${secretLabel}\n${votes.length} vote${votes.length === 1 ? "" : "s"} cast so far.`,
          ephemeral: false,
        });
        return;
      }

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
          const member = await fetchMember(interaction, vote._id.voted_user_id);
          message += `${member || "a player who left the server"}: ${vote.count} votes\n`;
        })
      );

      await interaction.editReply({
        content: `Current Votes\n${message}`,
        ephemeral: false,
      });
    }
    if (interaction.options.getSubcommand() === commandNames.SHOW_VOTERS_FOR) {
      if (isSecretVote) {
        const secretLabel = isMayorElection
          ? "🎩 Mayor votes are secret and can't be revealed until the election is over."
          : "🕵️ Voting is anonymous — who voted for who can't be revealed.";
        await interaction.editReply({
          content: secretLabel,
          ephemeral: false,
        });
        return;
      }

      const targetUser = interaction.options.getUser("target");
      const members = interaction.guild.members.cache;
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
        const voter = { member: members.get(vote.user_id), weight: vote.weight || 1 };
        let votedFor = votedForMap.get(vote.voted_user_id);
        if (votedFor) {
          votedForMap.set(vote.voted_user_id, [...votedFor, voter]);
        } else {
          votedForMap.set(vote.voted_user_id, [voter]);
          usersIdsOnVoterBoard.push(vote.voted_user_id);
        }
      });

      let message = "";

      _.forEach(usersIdsOnVoterBoard, (userId) => {
        message += `Players voting for ${members.get(userId)}\n`;
        _.forEach(votedForMap.get(userId), (voter) => {
          const mayorTag = voter.weight >= 2 ? " 🎩 (Mayor, counts as 2)" : "";
          message += `  ${voter.member}${mayorTag}\n`;
        });
      });

      await interaction.editReply({
        content: message || "No Votes Found",
        ephemeral: false,
      });
    }
  },
};
