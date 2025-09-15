const _ = require("lodash");
const { getCountedVotes, findSettings, findUser, deleteManyVotes } = require("../werewolf_db");
const { isDeadChaosTarget } = require("./characterHelpers/chaosDemonHelpers");
const { PowerUpNames } = require("./powerUpHelpers");
const { removesDeadPermissions, WaysToDie } = require("./deathHelper");

async function findVoteWinners(guildId, votingOutAmount) {
  // getCountedVotes will return the votes in descending order
  const cursor = await getCountedVotes(guildId);
  const allVotes = await cursor.toArray();

  let topVotes = [[]];
  let topCount = 0;
  let row = 0;
  
  _.forEach(allVotes, (vote) => {
    if (topVotes[row].length < votingOutAmount) {
      if (topCount !== 0 && vote.count !== topCount) {
        row++
        topVotes.push([])
      }
      topVotes[row].push(vote)
      topCount = vote.count
      return
    }
    if (vote.count === topCount) {
      topVotes[row].push(vote)
    }
  });

  votingOffData = {
    votedOff: [],
    randomVoteOff: [],
  }

  let playersLeftToVoteOut = votingOutAmount;

  for (const topVoteArray of topVotes) {
    if (playersLeftToVoteOut === topVoteArray.length) {
      votingOffData.votedOff.push(...topVoteArray);
      playersLeftToVoteOut = 0;
    } else if (playersLeftToVoteOut > topVoteArray.length) {
      playersLeftToVoteOut = playersLeftToVoteOut - topVoteArray.length;
      votingOffData.votedOff.push(...topVoteArray);
    } else if (playersLeftToVoteOut < topVoteArray.length) {
      playersLeftToVoteOut = 0;
      votingOffData.randomVoteOff = topVoteArray;
    }
    if (playersLeftToVoteOut === 0) {
      break;
    }
  }
  await deleteManyVotes({ guild_id: guildId });
  return votingOffData
}

async function handleHangingVotes(interaction) {
  const guildId = interaction.guild.id;
  const settings = await findSettings(guildId)
  const votingOutAmount = settings.double_hanging ? 2 : 1;
  const votingData = await findVoteWinners(guildId, votingOutAmount)
  const noVotes = _.isEmpty(votingData.votedOff) && _.isEmpty(votingData.randomVoteOff)

  let playersDeathInfo = []

  if (noVotes) {
    console.log("No Votes")
    return playersDeathInfo;
  }

  if (!_.isEmpty(votingData.votedOff)) {
    console.log("votingData.votedOff");
    console.log(votingData.votedOff);
  }
  if (!_.isEmpty(votingData.randomVoteOff)) {
    console.log("votingData.randomVoteOff");
    console.log(votingData.randomVoteOff);
  }

  for (const userVoted of votingData.votedOff) {
    const playerDeathInfo = await hangPlayer(interaction, userVoted, false)
    playersDeathInfo.push(playerDeathInfo)
  }

  if (!_.isEmpty(votingData.randomVoteOff) && playersDeathInfo.length < votingOutAmount) {
    const randomVotes = _.shuffle(votingData.randomVoteOff)
    while (randomVotes.length > 0 && playersDeathInfo.length < votingOutAmount) {
      const userVoted = randomVotes.pop()
      const playerDeathInfo = await hangPlayer(interaction, userVoted, true)
      playersDeathInfo.push(playerDeathInfo)
    }
  }

  return playersDeathInfo
}

async function hangPlayer(interaction, userVoted, isRandom) {
  const guildId = interaction.guild.id;
  console.log("userVoted._id.voted_user_id")
  console.log(userVoted?._id?.voted_user_id)
  const deadUser = await findUser(userVoted._id.voted_user_id, guildId);
  const deadMember = interaction.guild.members.cache.get(userVoted._id.voted_user_id);
  const isChaosTarget = await isDeadChaosTarget(interaction, deadUser);

  console.log("deadUser in hangPlayer")
  console.log(deadUser)
  const deathCharacter = await removesDeadPermissions(
    interaction,
    deadUser,
    deadMember,
    WaysToDie.HANGED,
  );

  let chaosWins = false;
  if (isChaosTarget && deathCharacter !== PowerUpNames.SHIELD) {
    chaosWins = true;
  }

  return {
    chaosWins,
    deathCharacter,
    member: deadMember,
    user: deadUser,
    random: isRandom,
  }
}

module.exports = {
  handleHangingVotes,
};
