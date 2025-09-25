const _ = require("lodash");
const {
  deleteAllUsers,
  deleteGame,
  deleteManyVotes,
  findGame,
  findOneUser,
  findAllUsers,
} = require("../werewolf_db");
const { characters, teams } = require("./characterHelpers/characterUtil");
const { removeGameRolesFromMembers } = require("./rolesHelpers");
const { endGuildJobs } = require("./schedulHelper");
const { organizeChannels } = require("./channelHelpers");
const { buildCoupleTeam } = require("./characterHelpers/cupidHelper");
const { getSideCharacters } = require("./userHelpers");

async function checkGame(interaction, chaosWinsIds) {
  const members = interaction.guild.members.cache;
  const roles = interaction.guild.roles.cache;

  const isGameOver = await checkForWinner(interaction, chaosWinsIds);

  if (!_.isEmpty(interaction.townAnnouncements)) {
    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);
    await organizedChannels.townSquare.send(
      interaction.townAnnouncements.join("\n")
    );
  }

  if (isGameOver) {
    await endGame(interaction, roles, members);
  }
}

async function checkForWinner(interaction, chaosWinsIds) {
  const { aliveUsers, deadUsers, loverTeams } = await orderAllPlayers(interaction);
  const game = await findGame(interaction.guild.id);
  const chaosCount = aliveUsers?.chaosDemon?.length || 0;
  const villagerCount = aliveUsers.villagers.length || 0;
  const werewolfCount = aliveUsers.werewolves.length
    ? aliveUsers.werewolves.length + aliveUsers.witches.length
    : 0;
  const vampireCount = aliveUsers.vampires.length || 0;
  const witchCount = aliveUsers.witches.length || 0;

  if (!_.isEmpty(chaosWinsIds)) {
    await sendChaosWinMessage(interaction, chaosWinsIds);
    return true;
  }

  if (villagerCount === 0 && werewolfCount === vampireCount && game.is_day) {
    return false;
  }

  const listUsers = (dbUsers) => {
    const members = interaction.guild.members.cache;
    const deadUsers = _.filter(dbUsers, (dbUser) => dbUser.user_id && dbUser.character)
    if (_.isEmpty(deadUsers)) {
      return "None"
    }
    
    return _.map(
      dbUsers,
      (dbUser) => {
        const sideCharacters = getSideCharacters(interaction, dbUser)
        return (
          `${members.get(dbUser.user_id) || (dbUser.nickname ?? dbUser.name)}! playing as ${dbUser.character} ${sideCharacters.join(", ")}`
        )
      }
    ).join("\n");
  };

  if (
    werewolfCount + vampireCount + villagerCount + witchCount + chaosCount ===
    0
  ) {
    interaction.townAnnouncements.push("# I WIN! Everyone is dead!");
    return true;
  }

  if (werewolfCount + vampireCount + villagerCount + witchCount + chaosCount === 2 && !_.isEmpty(loverTeams)) {
    coupleWinMessage(interaction, loverTeams)
    return true;
  }

  if (werewolfCount + vampireCount + chaosCount === 0) {
    const cupidTeamWinners = _.filter(loverTeams, (loveTeam) => loveTeam.couplesTeam === teams.VILLAGER)

    if (!_.isEmpty(cupidTeamWinners)) {
      coupleWinMessage(interaction, cupidTeamWinners)
      return true;
    }

    interaction.townAnnouncements.push(
      `# Villagers Win!
There are no more evil in the town. The town is saved!
## Winners
### Alive:
${listUsers(aliveUsers.villagers)}
### Dead:
${listUsers(deadUsers.villagers)}`
    );
    return true;
  }

  if (werewolfCount >= villagerCount + vampireCount + chaosCount) {
    const cupidTeamWinners = _.filter(loverTeams, (loveTeam) => loveTeam.couplesTeam === teams.WEREWOLF)

    if (!_.isEmpty(cupidTeamWinners)) {
      coupleWinMessage(interaction, cupidTeamWinners)
      return true;
    }

    interaction.townAnnouncements.push(
      `# Werewolves Win!
      Werewolves now equal or outnumber the town's remaining population.
      ## Winners
### Alive:
${listUsers([...aliveUsers.werewolves, ...aliveUsers.witches, ...aliveUsers.henchmen])}
### Dead:
${listUsers([...deadUsers.werewolves, ...deadUsers.witches, ...deadUsers.henchmen])}`
    );
    return true;
  }

  if (vampireCount >= villagerCount + werewolfCount + chaosCount) {

        const cupidTeamWinners = _.filter(loverTeams, (loveTeam) => loveTeam.couplesTeam === teams.VAMPIRE)

    if (!_.isEmpty(cupidTeamWinners)) {
      coupleWinMessage(interaction, cupidTeamWinners)
      return true;
    }
    interaction.townAnnouncements.push(
      `# Vampires Win!
      Vampires now equal or outnumber the town's remaining population.
      ## Winners
### Alive:
${listUsers(aliveUsers.vampires)}
### Dead:
${listUsers(deadUsers.vampires)}`
    );
    return true;
  }

  return false;
}

function coupleWinMessage(interaction, cupidTeamWinners) {
  const members = interaction.guild.members.cache;
  const userStatus = (user) => user.is_dead ? "(dead)" : "(alive)"
  interaction.townAnnouncements.push(`# Cupid and Couple Wins!`)
  cupidTeamWinners.forEach((coupleTeam) => {
    const cupidMember = members.get(coupleTeam.cupid.user_id);
    const sideCharacters = getSideCharacters(interaction, coupleTeam.cupid)
    interaction.townAnnouncements.push(`## Cupid: ${cupidMember} ${userStatus(coupleTeam.cupid)} ${sideCharacters.join(", ")}`)
    interaction.townAnnouncements.push(`## Cupid's Couple`)
    _.forEach(coupleTeam.cupidsCouple, (coupleUser) => {
      const coupleMember = members.get(coupleUser.user_id);
      const sideCharacters = getSideCharacters(interaction, coupleUser)
      interaction.townAnnouncements.push(`### * ${coupleMember} ${coupleUser.character} ${userStatus(coupleUser)} ${sideCharacters.join(", ")}`)
    })
  })
}

async function sendChaosWinMessage(interaction, chaosWinsIds) {
  const members = interaction.guild.members.cache;

  if (chaosWinsIds.length === 1) {
    const chaosDemonMember = members.get(chaosWinsIds[0]);
    interaction.townAnnouncements.push(
      `# Chaos Demon Victory!\nThe player you lynched was the Chaos Demon's marked target!\nAs a result, the village is plunged into chaos, and everyone loses... except for ${chaosDemonMember} the devious Chaos Demon`
    );
    return;
  }

  const memberMessage = _.map(chaosWinsIds, (id) => `${members.get(id)}`)

  interaction.townAnnouncements.push(
    `# Multiple Chaos Demon Victory!\nThe player you lynched was multiple Chaos Demon's marked target!\nAs a result, the village is plunged into chaos, and everyone loses... except for ${memberMessage.join(" and ")} the devious Chaos Demons`
  );
}

async function orderAllPlayers(interaction) {
  const allDbUsersCursor = await findAllUsers(interaction.guild.id);
  const allDbUsers = await allDbUsersCursor.toArray();
  const aliveUsers = {
    werewolves: [],
    vampires: [],
    witches: [],
    villagers: [],
    henchmen: [],
    chaosDemon: [],
  };
  const deadUsers = {
    werewolves: [],
    vampires: [],
    witches: [],
    villagers: [],
    henchmen: [],
    chaosDemon: [],
  };
  const loverTeams = []

  for (const dbUser of allDbUsers) {
    let userArray = aliveUsers;
    if (dbUser.character === characters.CUPID) {
      const couple = buildCoupleTeam(dbUser, allDbUsers)
      if (couple) {
        console.log("couple")
        console.log(couple)
        loverTeams.push(couple)
      }
    }
    if (dbUser.is_dead && !dbUser.is_injured) {
      userArray = deadUsers;
    }
    if (dbUser.character === characters.WEREWOLF) {
      userArray.werewolves.push(dbUser);
    } else if (dbUser.is_vampire) {
      userArray.vampires.push(dbUser);
    } else if (dbUser.character === characters.WITCH) {
      userArray.witches.push(dbUser);
    } else if (dbUser.character === characters.CHAOS_DEMON) {
      userArray.chaosDemon.push(dbUser);
    } else if (dbUser.is_henchman) {
      userArray.henchmen.push(dbUser)
    } else {
      userArray.villagers.push(dbUser);
    }
  };

  return { aliveUsers, deadUsers, loverTeams };
}

async function endGame(interaction, roles, members, reset) {
  const guildId = interaction.guild.id;
  // remove all discord roles from players
  await removeGameRolesFromMembers(members, roles, reset);

  // delete all game info from database
  await deleteAllUsers(guildId);
  await deleteGame(guildId);
  await deleteManyVotes({ guild_id: guildId });
  await endGuildJobs(interaction);
}

module.exports = {
  checkGame,
  endGame,
};
