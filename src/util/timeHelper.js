require("dotenv").config();
const _ = require("lodash");
const schedule = require("node-schedule");
const {
  organizeChannels,
  removeChannelPermissions,
  giveSeerChannelPermissions,
} = require("./channelHelpers");
const { organizeRoles, removeGameRolesFromMembers } = require("./rolesHelpers");
const {
  removeUsersPermissions,
  resetNightPowers,
  gameCommandPermissions,
  addApprenticeSeePermissions,
  characters,
} = require("./commandHelpers");
const {
  findGame,
  updateGame,
  deleteGame,
  findUser,
  findOneUser,
  updateUser,
  deleteAllUsers,
  getCountedVotes,
  deleteAllVotes,
  findAllUsers,
} = require("../werewolf_db");

async function timeScheduling(interaction, dayHour, nightHour) {
  await schedule.gracefulShutdown();
  const game = await findGame(interaction.guild.id);
  if (!game) {
    await interaction.reply({
      content: "No game to schedule",
      ephemeral: true,
    });
    return;
  }
  const nightRule = new schedule.RecurrenceRule();
  const dayRule = new schedule.RecurrenceRule();
  nightRule.minute = 0;
  nightRule.hour = nightHour;
  nightRule.tz = process.env.TIME_ZONE_TZ;
  dayRule.minute = 0;
  dayRule.hour = dayHour;
  dayRule.tz = process.env.TIME_ZONE_TZ;
  schedule.scheduleJob(nightRule, () => nightTimeJob(interaction));
  schedule.scheduleJob(dayRule, () => dayTimeJob(interaction));
  return true;
}

// Handles werewolf kill.
async function dayTimeJob(interaction) {
  const guildId = interaction.guild.id;
  const client = interaction.guild.client;
  const members = await interaction.guild.members.fetch();
  const roles = await interaction.guild.roles.fetch();
  const users = client.users.cache;
  const organizedRoles = organizeRoles(roles);
  const channels = client.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const game = await findGame(guildId);

  // resetting bodyguards last user guarded if they didn't use their power.
  if (!game.user_guarded_id || !game.user_protected_id) {
    const cursor = await findAllUsers(guildId);
    const allUsers = await cursor.toArray();
    const bodyguard = _.head(
      allUsers.filter((user) => user.character === characters.BODYGUARD)
    );
    if (bodyguard?.guard) {
      // bodyguard did not use power last night
      await updateUser(bodyguard.user_id, guildId, {
        last_user_guard_id: null,
      });
    }
  }

  if (game.is_day) {
    console.log("It is currently day skip");
    return;
  }
  let message = "No one died last night";

  if (game.user_death_id) {
    if (
      game.user_death_id !== game.user_protected_id &&
      game.user_death_id !== game.user_guarded_id
    ) {
      const deadUser = await findUser(game.user_death_id, guildId);
      const deadMember = members.get(game.user_death_id);
      const deathCharacter = await removesDeadPermissions(
        interaction,
        deadUser,
        deadMember,
        organizedRoles
      );
      const discordUser = users.get(game.user_death_id);
      // TODO: add check to see if it was the hunter who died
      message = `Last night the ${deathCharacter} named ${discordUser} was killed by the werewolves.`;
    }
  }

  await updateGame(guildId, {
    user_death_id: null,
    user_protected_id: null,
    user_guarded_id: null,
    is_day: true,
    first_night: false,
  });

  organizedChannels.townSquare.send(`${message}\n It is day time`);

  await checkGame(
    interaction,
    members,
    organizedRoles.alive,
    roles,
    guildId,
    organizedChannels.townSquare
  );
}

// Handles town votes and death
async function nightTimeJob(interaction) {
  const guildId = interaction.guild.id;
  const client = interaction.guild.client;
  const members = await interaction.guild.members.fetch();
  const roles = await interaction.guild.roles.fetch();
  const users = client.users.cache;
  const organizedRoles = organizeRoles(roles);
  const channels = await client.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const game = await findGame(guildId);

  if (game.first_night) {
    await updateGame(guildId, {
      is_day: false,
    });
    organizedChannels.werewolves.send(
      "This is the first night. Choose someone to kill with the `/kill` command"
    );
    organizedChannels.bodyguard.send(
      "This is the first night. Choose someone to guard with the `/guard` command"
    );
    organizedChannels.seer.send(
      "This is the first night. Choose someone to see with the `/see` command"
    );
    return;
  }
  if (!game.is_day) {
    console.log("It is currently night skip");
    return;
  }
  let message;

  const cursor = await getCountedVotes(guildId);
  const allVotes = await cursor.toArray();

  let topVotes = [];
  let topCount = 0;

  _.forEach(allVotes, (vote) => {
    if (vote.count >= topCount) {
      topVotes.push(vote);
      topCount = vote.count;
    }
  });

  let killedRandomly = false;
  if (topVotes.length > 1) {
    killedRandomly = true;
  }
  const voteWinner = _.head(_.shuffle(topVotes));

  await deleteAllVotes(guildId);
  await resetNightPowers(guildId);
  if (!voteWinner) {
    await updateGame(guildId, {
      is_day: false,
    });
    organizedChannels.townSquare.send("No one has voted...\nIt is night");
    return;
  }
  const deadUser = await findUser(voteWinner._id.voted_user_id, guildId);
  const deadMember = members.get(voteWinner._id.voted_user_id);

  const deathCharacter = await removesDeadPermissions(
    interaction,
    deadUser,
    deadMember,
    organizedRoles
  );

  // TODO: add check to see if it was the hunter who died

  const discordUser = users.get(voteWinner._id.voted_user_id);
  if (killedRandomly) {
    message = `There was a tie so I randomly picked ${discordUser} to die`;
  } else {
    message = `The town has decided to hang ${discordUser}`;
  }

  const deathMessage = `The town has killed a ${deathCharacter}`;
  await updateGame(guildId, {
    is_day: false,
  });

  organizedChannels.townSquare.send(
    `${message}\n${deathMessage}\n It is night time`
  );

  await checkGame(
    interaction,
    members,
    organizedRoles.alive,
    roles,
    guildId,
    organizedChannels.townSquare
  );
}

async function removesDeadPermissions(
  interaction,
  deadUser,
  deadMember,
  organizedRoles
) {
  deadMember.roles.remove(organizedRoles.alive);
  deadMember.roles.add(organizedRoles.dead);
  // removes deadUser character command and channel Permissions
  await removeUsersPermissions(interaction, deadUser);
  await removeChannelPermissions(interaction, deadMember);
  await updateUser(deadUser.user_id, interaction.guild.id, { dead: true });

  let deadCharacter = deadUser.character;

  if (deadCharacter === characters.LYCAN) {
    deadCharacter = characters.VILLAGER;
  }

  if (deadCharacter === characters.SEER) {
    const apprenticeSeerUser = await findOneUser({
      guild_id: interaction.guild.id,
      character: characters.APPRENTICE_SEER,
    });

    if (apprenticeSeerUser && !apprenticeSeerUser.dead) {
      await updateUser(apprenticeSeerUser.user_id, interaction.guild.id, {
        character: characters.SEER,
      });
      const discordApprenticeUser = interaction.guild.members.cache.get(
        apprenticeSeerUser.user_id
      );
      giveSeerChannelPermissions(interaction, discordApprenticeUser);
      addApprenticeSeePermissions(interaction, apprenticeSeerUser);
    }
  }

  return deadCharacter;
}

async function checkGame(
  interaction,
  members,
  aliveRole,
  roles,
  guildId,
  townSquare
) {
  aliveMembers = members
    .map((member) => {
      if (member._roles.includes(aliveRole.id)) {
        return member;
      }
    })
    .filter((m) => m);

  let werewolfCount = 0;
  let villagerCount = 0;

  await Promise.all(
    aliveMembers.map(async (member) => {
      const dbUser = await findUser(member.user.id, guildId);
      if (dbUser.character === characters.WEREWOLF) {
        werewolfCount += 1;
      } else {
        villagerCount += 1;
      }
    })
  );

  if (werewolfCount === 0) {
    townSquare.send("There are no more werewolves. **Villagers Win!**");
    await endGame(interaction, guildId, roles, members);
  }

  if (werewolfCount >= villagerCount) {
    townSquare.send("Werewolves out number the villagers. **Werewolves Win!**");
    await endGame(interaction, guildId, roles, members);
  }
}

async function endGame(interaction, guildId, roles, members) {
  // stop scheduling day and night
  await schedule.gracefulShutdown();

  // removing all users game command permissions
  const cursor = await findAllUsers(guildId);
  const allUsers = await cursor.toArray();
  await gameCommandPermissions(interaction, allUsers, false);

  // remove all discord roles from players
  await removeGameRolesFromMembers(members, roles);

  // delete all game info from database
  await deleteAllUsers(guildId);
  await deleteGame(guildId);
  await deleteAllVotes(guildId);
}

module.exports = {
  timeScheduling,
  dayTimeJob,
  nightTimeJob,
};
