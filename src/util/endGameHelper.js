const _ = require("lodash");
const {
  deleteAllUsers,
  deleteGame,
  deleteManyVotes,
  findGame,
  findOneUser,
  findAllUsers,
} = require("../werewolf_db");
const { characters } = require("./characterHelpers/characterUtil");
const { removeGameRolesFromMembers } = require("./rolesHelpers");
const { endGuildJobs } = require("./schedulHelper");

async function checkGame(interaction, chaosWins) {
  const members = interaction.guild.members.cache;
  const roles = interaction.guild.roles.cache;

  const isGameOver = await checkForWinner(interaction, chaosWins);

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

async function checkForWinner(interaction, chaosWins) {
  const { aliveUsers, deadUsers } = await orderAllPlayers(interaction);
  const game = await findGame(interaction.guild.id);
  const chaosCount = aliveUsers?.chaosDemon?.length || 0;
  const villagerCount = aliveUsers.villagers.length || 0;
  const werewolfCount = aliveUsers.werewolves.length
    ? aliveUsers.werewolves.length + aliveUsers.witches.length
    : 0;
  const vampireCount = aliveUsers.vampires.length || 0;
  const witchCount = aliveUsers.witches.length || 0;

  if (chaosWins) {
    await sendChaosWinMessage(interaction);
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
      (dbUser) =>
        `${members.get(dbUser.user_id)}! playing as ${dbUser.character}`
    ).join("\n");
  };

  if (
    werewolfCount + vampireCount + villagerCount + witchCount + chaosCount ===
    0
  ) {
    interaction.townAnnouncements.push("# I WIN! Everyone is dead!");
    return true;
  }

  if (werewolfCount + vampireCount + chaosCount === 0) {
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
    interaction.townAnnouncements.push(
      `# Werewolves Win!
      Werewolves now outnumber the town's remaining population.
      ## Winners
### Alive:
${listUsers([...aliveUsers.werewolves, ...aliveUsers.witches])}
### Dead:
${listUsers([deadUsers.werewolves, ...deadUsers.witches])}`
    );
    return true;
  }

  if (vampireCount >= villagerCount + werewolfCount + chaosCount) {
    interaction.townAnnouncements.push(
      `# Vampires Win!
      Vampires now outnumber the town's remaining population.
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

async function sendChaosWinMessage(interaction) {
  const members = interaction.guild.members.cache;
  const chaosDemon = await findOneUser({
    guild_id: interaction.guild.id,
    character: characters.CHAOS_DEMON,
  });
  const chaosDemonMember = members.get(chaosDemon.user_id);

  interaction.townAnnouncements.push(
    `# Chaos Demon Victory!
The player you lynched was the Chaos Demon's marked target!
As a result, the village is plunged into chaos, and everyone loses... except for ${chaosDemonMember} the devious Chaos Demon`
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
    chaosDemon: [],
  };
  const deadUsers = {
    werewolves: [],
    vampires: [],
    witches: [],
    villagers: [],
    chaosDemon: [],
  };

  _.forEach(allDbUsers, (dbUser) => {
    let userArray = aliveUsers;
    if (dbUser.is_dead) {
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
    } else {
      userArray.villagers.push(dbUser);
    }
  });

  return { aliveUsers, deadUsers };
}

async function endGame(interaction, roles, members) {
  const guildId = interaction.guild.id;
  // remove all discord roles from players
  await removeGameRolesFromMembers(members, roles);

  // delete all game info from database
  await deleteAllUsers(guildId);
  await deleteGame(guildId);
  await deleteManyVotes({ guild_id: guildId });
  await endGuildJobs(interaction);
}

module.exports = {
  checkGame,
};
