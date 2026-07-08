const _ = require("lodash");
const { getCountedVotes, deleteManyVotes, updateUser } = require("../werewolf_db");

async function electMayor(guildId) {
  const cursor = await getCountedVotes(guildId);
  const allVotes = await cursor.toArray();
  await deleteManyVotes({ guild_id: guildId });

  if (_.isEmpty(allVotes)) {
    return null;
  }

  const topCount = allVotes[0].count;
  const topCandidates = _.filter(allVotes, (vote) => vote.count === topCount);
  const winner = _.sample(topCandidates);
  const mayorUserId = winner._id.voted_user_id;

  await updateUser(mayorUserId, guildId, { is_mayor: true });

  return mayorUserId;
}

module.exports = {
  electMayor,
};
