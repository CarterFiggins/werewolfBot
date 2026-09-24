const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { getCountedVotes, findManyVotes, findGame, findSettings } = require("../werewolf_db");
const { fetchMember } = require("../util/discordHelpers");
const { buildVotersForMessage } = require("../util/voteHelpers");

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
    // Ephemeral status is locked in at the initial reply, so we need to know
    // isSecretVote (and which subcommand) before deferring - it can't be
    // changed later on editReply.
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild?.id;
    let isMayorElection = false;
    let isAnonymousVote = false;
    let isSecretVote = false;

    if (guildId) {
      const game = await findGame(guildId);
      const settings = await findSettings(guildId);
      isMayorElection = settings.mayor_election && game.first_night;
      isAnonymousVote = settings.anonymous_voting && !isMayorElection;
      isSecretVote = isMayorElection || isAnonymousVote;
    }

    // /show votes only ever reveals a count, so it always stays public.
    // /show voters_for reveals who voted for who, so hide it when secret.
    const isEphemeral = subcommand === commandNames.SHOW_VOTERS_FOR && isSecretVote;

    await interaction.deferReply({ ephemeral: isEphemeral });

    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
    });

    if (deniedMessage) {
      await interaction.editReply({
        content: deniedMessage,
      });
      return;
    }

    if (subcommand === commandNames.SHOW_VOTES) {
      if (isSecretVote) {
        const secretLabel = isMayorElection
          ? "# 🎩 Mayor votes are secret and won't be revealed."
          : "# 🕵️ Voting is anonymous and won't be revealed.";
        const cursor = await findManyVotes({ guild_id: guildId });
        const votes = await cursor.toArray();
        await interaction.editReply({
          content: `${secretLabel}\n# ${votes.length} vote${votes.length === 1 ? "" : "s"} cast so far.`,
        });
        return;
      }

      const cursor = await getCountedVotes(guildId);
      const allVotes = await cursor.toArray();
      if (_.isEmpty(allVotes)) {
        await interaction.editReply({
          content: "# There are no votes to be counted",
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
        content: `# Current Votes\n${message}`,
      });
    }
    if (subcommand === commandNames.SHOW_VOTERS_FOR) {
      if (isSecretVote) {
        const secretLabel = isMayorElection
          ? "# 🎩 Mayor votes are secret and can't be revealed until the election is over."
          : "# 🕵️ Voting is anonymous — who voted for who can't be revealed.";
        await interaction.editReply({
          content: secretLabel,
        });
        return;
      }

      const targetUser = interaction.options.getUser("target");
      const members = interaction.guild.members.cache;
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

      const votes = await cursorVotes.toArray();
      const message = buildVotersForMessage(votes, members);

      await interaction.editReply({
        content: message || "# No Votes Found",
      });
    }
  },
};
