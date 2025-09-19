const _ = require("lodash");
const { getCountedVotes, findSettings, findUser, deleteManyVotes } = require("../werewolf_db");
const { foundAliveChaosDemonsWithTarget } = require("./characterHelpers/chaosDemonHelpers");
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

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function hangPlayer(interaction, userVoted, isRandom) {
  const guildId = interaction.guild.id;
  let deadUser = await findUser(userVoted._id.voted_user_id, guildId);

  if (!deadUser) {
    console.log("guildId")
    console.log(guildId)
    console.log("userVoted?._id?.voted_user_id")
    console.log(userVoted?._id?.voted_user_id)
    // Running into error where we can't find the user in db. Works when night command is run after.
    // Delaying 1 sec to see if we can call db again to get user.
    await delay(1000);
    deadUser = await findUser(userVoted._id.voted_user_id, guildId);
  }

  if (!deadUser) {
    console.log("Could not find user with this id:", userVoted?._id?.voted_user_id)
    console.log("guild id:", guildId)
    throw new Error(`This user id:${userVoted?._id?.voted_user_id} does not exist`)
  }
  const deadMember = interaction.guild.members.cache.get(userVoted._id.voted_user_id);
  const chaosDemons = await foundAliveChaosDemonsWithTarget(interaction, deadUser);

  const deathCharacter = await removesDeadPermissions(
    interaction,
    deadUser,
    deadMember,
    WaysToDie.HANGED,
  );

  let chaosWinsIds = [];
  if (!_.isEmpty(chaosDemons) && deathCharacter !== PowerUpNames.SHIELD) {
    chaosWinsIds = _.map(chaosDemons, (c) => c.user_id);
  }

  return {
    chaosWinsIds,
    deathCharacter,
    member: deadMember,
    user: deadUser,
    random: isRandom,
  }
}

module.exports = {
  handleHangingVotes,
};
