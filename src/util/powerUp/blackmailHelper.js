const _ = require("lodash");
const {
  findManyUsers,
  findManyVotes,
  upsertVote,
  deleteManyVotes,
  updateManyUsers,
} = require("../../werewolf_db");
const { fetchMember } = require("../discordHelpers");
const { sendMemberMessage } = require("../botMessages/sendMemberMessages");

// Blackmailed players vote with the player blackmailing them until the hanging.
// Call this any time the blackmailer's vote changes.
async function syncBlackmailedVotes(guildId, blackmailerId) {
  const cursorBlackmailed = await findManyUsers({
    guild_id: guildId,
    is_dead: false,
    blackmailed_by_user_id: blackmailerId,
  });
  const blackmailedUsers = await cursorBlackmailed.toArray();
  if (_.isEmpty(blackmailedUsers)) {
    return;
  }

  const cursorVotes = await findManyVotes({ guild_id: guildId, user_id: blackmailerId });
  const blackmailerVote = _.first(await cursorVotes.toArray());

  for (const blackmailedUser of blackmailedUsers) {
    // Blackmailed players who can't vote right now don't get a vote.
    const canVote = !blackmailedUser.is_stunned && !blackmailedUser.is_muted && !blackmailedUser.is_injured;
    if (!blackmailerVote || !canVote) {
      await deleteManyVotes({ guild_id: guildId, user_id: blackmailedUser.user_id });
    } else {
      await upsertVote(blackmailedUser.user_id, guildId, {
        guild_id: guildId,
        user_id: blackmailedUser.user_id,
        username: blackmailedUser.name,
        voted_user_id: blackmailerVote.voted_user_id,
        voted_username: blackmailerVote.voted_username,
        weight: blackmailedUser.is_mayor ? 2 : 1,
      });
    }
    // The blackmailed player may have blackmailed someone before they were blackmailed.
    // A blackmailed player can't blackmail, so this chain can't loop.
    await syncBlackmailedVotes(guildId, blackmailedUser.user_id);
  }
}

// When the blackmailer dies the blackmail ends and the blackmailed players vote on their own again.
async function releaseBlackmailedBy(interaction, blackmailerId) {
  const guildId = interaction.guild.id;
  const cursorBlackmailed = await findManyUsers({
    guild_id: guildId,
    is_dead: false,
    blackmailed_by_user_id: blackmailerId,
  });
  const blackmailedUsers = await cursorBlackmailed.toArray();
  if (_.isEmpty(blackmailedUsers)) {
    return;
  }

  await updateManyUsers(
    { guild_id: guildId, blackmailed_by_user_id: blackmailerId },
    { blackmailed_by_user_id: null }
  );
  for (const blackmailedUser of blackmailedUsers) {
    await deleteManyVotes({ guild_id: guildId, user_id: blackmailedUser.user_id });
    await syncBlackmailedVotes(guildId, blackmailedUser.user_id);
    const blackmailedMember = await fetchMember(interaction, blackmailedUser.user_id);
    await sendMemberMessage(blackmailedMember, "📜 The blackmail against you is over and your vote has been removed. You are free to vote again.");
  }
}

// Blackmail only lasts until the hanging.
async function removeBlackmails(guildId) {
  await updateManyUsers(
    { guild_id: guildId, blackmailed_by_user_id: { $ne: null } },
    { blackmailed_by_user_id: null }
  );
}

module.exports = {
  syncBlackmailedVotes,
  releaseBlackmailedBy,
  removeBlackmails,
};
