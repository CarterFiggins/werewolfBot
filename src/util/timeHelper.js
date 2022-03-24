require("dotenv").config();
const _ = require("lodash");
const schedule = require("node-schedule");
const {
  organizeChannels,
  removeChannelPermissions,
  giveSeerChannelPermissions,
  giveWerewolfChannelPermissions,
} = require("./channelHelpers");
const {
  organizeRoles,
  removeGameRolesFromMembers,
  getRole,
  roleNames,
} = require("./rolesHelpers");
const {
  getAliveUsersIds,
  getAliveMembers,
  castWitchCurse,
  removeUserVotes,
} = require("./userHelpers");
const {
  removeUsersPermissions,
  resetNightPowers,
  gameCommandPermissions,
  addApprenticeSeePermissions,
  addCursedKillPermissions,
  characters,
} = require("./commandHelpers");
const {
  findGame,
  updateGame,
  deleteGame,
  findUser,
  findOneUser,
  updateUser,
  findUsersWithIds,
  deleteAllUsers,
  getCountedVotes,
  findAllUsers,
  findManyUsers,
  deleteManyVotes,
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
  // TODO: when a user can set the time and they set it at midnight or later than we will need to wrap around to 23
  const warningHour = nightHour - 1;

  const nightRule = new schedule.RecurrenceRule();
  const dayRule = new schedule.RecurrenceRule();
  const warningRule = new schedule.RecurrenceRule();
  nightRule.minute = 0;
  nightRule.hour = nightHour;
  nightRule.tz = process.env.TIME_ZONE_TZ;
  dayRule.minute = 0;
  dayRule.hour = dayHour;
  dayRule.tz = process.env.TIME_ZONE_TZ;
  warningRule.minute = 30;
  warningRule.hour = warningHour;
  warningRule.tz = process.env.TIME_ZONE_TZ;
  schedule.scheduleJob(nightRule, () => nightTimeJob(interaction));
  schedule.scheduleJob(dayRule, () => dayTimeJob(interaction));
  schedule.scheduleJob(warningRule, () => nightTimeWarning(interaction));
  return true;
}

async function nightTimeWarning(interaction) {
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const aliveRole = await getRole(interaction, roleNames.ALIVE);
  await organizedChannels.townSquare.send(
    `${aliveRole} 30 minutes until night`
  );
}

// Handles werewolf kill.
async function dayTimeJob(interaction) {
  const guildId = interaction.guild.id;
  const game = await findGame(guildId);

  if (game.is_day) {
    console.log("It is currently day skip");
    return;
  }

  const members = await interaction.guild.members.fetch();
  const roles = await interaction.guild.roles.fetch();
  const organizedRoles = organizeRoles(roles);
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);

  const cursorWitches = await findManyUsers({
    guild_id: guildId,
    character: characters.WITCH,
  });
  const witches = await cursorWitches.toArray();

  await Promise.all(
    _.map(witches, async (witch) => {
      if (witch.target_cursed_user_id) {
        await updateUser(witch.target_cursed_user_id, guildId, {
          is_cursed: true,
        });
        await updateUser(witch.user_id, guildId, {
          target_cursed_user_id: null,
        });
      }
    })
  );

  let message = "";

  const cursorBodyguards = await findManyUsers({
    guild_id: guildId,
    character: characters.BODYGUARD,
  });
  const bodyGuards = await cursorBodyguards.toArray();

  const guardedIds = await Promise.all(
    _.map(bodyGuards, async (bodyguard) => {
      await updateUser(bodyguard.user_id, guildId, {
        last_guarded_user_id: bodyguard.guarded_user_id,
        guarded_user_id: null,
      });

      return bodyguard.guarded_user_id;
    })
  );

  const deathIds = _.difference(
    [game.user_death_id, game.second_user_death_id],
    [...guardedIds, null]
  );

  // Allow double kill
  if (!_.isEmpty(deathIds)) {
    const cursor = await findUsersWithIds(guildId, deathIds);
    const deadUsers = await cursor.toArray();
    await Promise.all(
      _.map(deadUsers, async (deadUser) => {
        const deadMember = members.get(deadUser.user_id);
        let isDead = true;

        if (deadUser.character === characters.CURSED) {
          // join werewolf team
          await updateUser(deadUser.user_id, interaction.guild.id, {
            character: characters.WEREWOLF,
          });
          const discordDeadUser = interaction.guild.members.cache.get(
            deadUser.user_id
          );
          await giveWerewolfChannelPermissions(interaction, discordDeadUser);
          await addCursedKillPermissions(interaction, discordDeadUser);
          await organizedChannels.werewolves.send(
            `${discordDeadUser} did not die and has turned into a werewolf! :wolf:`
          );
          isDead = false;
        }

        if (isDead) {
          const deathCharacter = await removesDeadPermissions(
            interaction,
            deadUser,
            deadMember,
            organizedRoles
          );
          if (deathCharacter === characters.HUNTER) {
            message += `Last night the werewolves injured the **${deathCharacter}**\n${deadMember} you don't have long to live. Grab your gun and \`/shoot\` someone.\n`;
          } else {
            message += `Last night the **${deathCharacter}** named ${deadMember} was killed by the werewolves.\n`;
          }
        }
      })
    );

    if (game.is_baker_dead) {
      message += await starveUser(interaction, organizedRoles, deathIds);
    }
  } else if (game.is_baker_dead) {
    message += await starveUser(interaction, organizedRoles);
  }

  await updateGame(guildId, {
    user_death_id: null,
    second_user_death_id: null,
    wolf_double_kill: false,
    is_day: true,
    first_night: false,
  });

  const backUpMessage = "No one died from a werewolf last night.\n";

  organizedChannels.townSquare.send(
    `${message || backUpMessage}**It is day time**`
  );

  await checkGame(interaction);
}

// Handles town votes and death
async function nightTimeJob(interaction) {
  const guildId = interaction.guild.id;
  const members = await interaction.guild.members.fetch();
  const roles = await interaction.guild.roles.fetch();
  const organizedRoles = organizeRoles(roles);
  const channels = await interaction.guild.channels.cache;
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

  await deleteManyVotes({ guild_id: guildId });
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

  let cursedMessage = "";

  if (deadUser.character === characters.WITCH) {
    cursedMessage = await castWitchCurse(
      interaction,
      organizedRoles,
      removesDeadPermissions
    );
  }

  const deathCharacter = await removesDeadPermissions(
    interaction,
    deadUser,
    deadMember,
    organizedRoles
  );

  if (killedRandomly) {
    message = `There was a tie so I randomly picked ${deadMember} to die`;
  } else {
    message = `The town has decided to hang ${deadMember}`;
  }

  let deathMessage = `The town has killed a **${deathCharacter}**`;

  if (deathCharacter === characters.HUNTER) {
    deathMessage = `The town has injured the **${deathCharacter}**\n${deadMember} you don't have long to live. Grab your gun and \`/shoot\` someone.`;
  }

  await updateGame(guildId, {
    is_day: false,
  });

  organizedChannels.townSquare.send(
    `${message}\n${deathMessage}\n${cursedMessage}\n**It is night time**`
  );

  await checkGame(interaction);
}

async function removesDeadPermissions(
  interaction,
  deadUser,
  deadMember,
  organizedRoles
) {
  const guildId = interaction.guild.id;
  let deadCharacter = deadUser.character;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  if (deadCharacter === characters.HUNTER && !deadUser.death) {
    await updateUser(deadUser.user_id, guildId, {
      can_shoot: true,
      death: true,
    });

    const currentDate = new Date();
    const hours = 4;
    const shootingLimit = new Date(
      currentDate.setHours(currentDate.getHours() + hours)
    );

    schedule.scheduleJob(shootingLimit, () =>
      hunterShootingLimitJob(interaction, deadMember, organizedRoles)
    );

    return deadCharacter;
  }

  // removes deadUser character command and channel Permissions
  deadMember.roles.remove(organizedRoles.alive);
  deadMember.roles.add(organizedRoles.dead);

  await removeUsersPermissions(interaction, deadUser);
  await removeChannelPermissions(interaction, deadMember);
  await removeUserVotes(guildId, deadUser.user_id);
  await updateUser(deadUser.user_id, guildId, { dead: true });

  if (deadCharacter === characters.LYCAN) {
    deadCharacter = characters.VILLAGER;
  } else if (deadCharacter === characters.BAKER) {
    await updateGame(guildId, {
      is_baker_dead: true,
    });
  } else if (deadCharacter === characters.WEREWOLF && deadUser.is_cub) {
    await updateGame(guildId, {
      wolf_double_kill: true,
    });
    await organizedChannels.werewolves.send(
      `The Werewolf Cub name ${deadMember} has been killed :rage:\nTonight you will be able to target two villagers!\nhttps://tenor.com/86LT.gif`
    );
    deadCharacter = characters.CUB;
  } else if (deadCharacter === characters.SEER) {
    const apprenticeSeerUser = await findOneUser({
      guild_id: guildId,
      character: characters.APPRENTICE_SEER,
    });

    const foolUser = await findOneUser({
      guild_id: guildId,
      character: characters.FOOL,
    });

    if (apprenticeSeerUser && !apprenticeSeerUser.death) {
      const discordApprenticeUser = interaction.guild.members.cache.get(
        apprenticeSeerUser.user_id
      );
      if (foolUser && !foolUser.death) {
        let roles = [characters.SEER, characters.FOOL];

        const discordFoolUser = interaction.guild.members.cache.get(
          foolUser.user_id
        );

        roles = _.shuffle(roles);
        const apprenticeNewRole = roles.pop();
        const foolNewRole = roles.pop();
        await updateUser(apprenticeSeerUser.user_id, guildId, {
          character: apprenticeNewRole,
        });
        await updateUser(foolUser.user_id, guildId, {
          character: foolNewRole,
        });
        await organizedChannels.seer.send(
          `${discordApprenticeUser} and ${discordFoolUser} the master seer has died.\nOne of you is now the fool and the other is the seer.\nYou don't know who is who good luck.`
        );
        await organizedChannels.afterLife.send(
          `${discordApprenticeUser} is now the ${apprenticeNewRole}\n${discordFoolUser} is now the ${foolNewRole}`
        );
      } else {
        await updateUser(apprenticeSeerUser.user_id, guildId, {
          character: characters.SEER,
        });
        await organizedChannels.seer.send(
          `${discordApprenticeUser} the master seer has died and you must take their place`
        );
      }
      await giveSeerChannelPermissions(interaction, discordApprenticeUser);
      await addApprenticeSeePermissions(interaction, apprenticeSeerUser);
    }
  }

  return deadCharacter;
}

async function checkGame(interaction) {
  const members = interaction.guild.members.cache;
  const guildId = interaction.guild.id;
  const roles = interaction.guild.roles.cache;
  const aliveMembers = await getAliveMembers(interaction);
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);

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
    organizedChannels.townSquare.send(
      "There are no more werewolves. **Villagers Win!**"
    );
    await endGame(interaction, guildId, roles, members);
  }

  if (werewolfCount >= villagerCount) {
    organizedChannels.townSquare.send(
      "Werewolves out number the villagers. **Werewolves Win!**"
    );
    await endGame(interaction, guildId, roles, members);
  }
}

async function hunterShootingLimitJob(
  interaction,
  deadHunterMember,
  organizedRoles
) {
  const deadDbHunter = await findUser(
    deadHunterMember.user.id,
    interaction.guild.id
  );
  if (!deadDbHunter.can_shoot) {
    return;
  }
  // get all alive users but not the hunter
  let aliveUserIds = await getAliveUsersIds(interaction);

  aliveUserIds = _.filter(aliveUserIds, (id) => id != deadHunterMember.user.id);

  const shotUserId = _.head(_.shuffle(aliveUserIds));
  const shotUser = await findUser(shotUserId, interaction.guild.id);
  const shotMember = interaction.guild.members.cache.get(shotUserId);
  // kill hunter
  await removesDeadPermissions(
    interaction,
    deadDbHunter,
    deadHunterMember,
    organizedRoles
  );
  // kill targeted user
  const deadCharacter = await removesDeadPermissions(
    interaction,
    shotUser,
    shotMember,
    organizedRoles
  );

  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  let message = "";
  if (deadCharacter === characters.HUNTER) {
    message = `${shotMember} you have been injured and don't have long to live. Grab you gun and \`/shoot\` someone.`;
  }
  await organizedChannels.townSquare.send(
    `${deadHunterMember} didn't have time to shoot and died. They dropped their gun and it shot the ${deadCharacter} named ${shotMember}\n${message}\n`
  );
  await checkGame(interaction);
}

async function starveUser(interaction, organizedRoles, deathIds) {
  let aliveUserIds = await getAliveUsersIds(interaction);

  const cursor = await findUsersWithIds(interaction.guild.id, aliveUserIds);
  let aliveUsers = await cursor.toArray();

  if (!_.isEmpty(deathIds)) {
    aliveUsers = _.filter(
      aliveUsers,
      (user) =>
        !deathIds.includes(user.user_id) &&
        user.character !== characters.WEREWOLF &&
        user.character !== characters.WITCH
    );
  } else {
    aliveUsers = _.filter(
      aliveUsers,
      (user) => user.character !== characters.WEREWOLF
    );
  }

  const starvedUser = _.head(_.shuffle(aliveUsers));

  if (_.isEmpty(starvedUser)) {
    return "No one starved";
  }

  const starvedMember = interaction.guild.members.cache.get(
    starvedUser.user_id
  );
  const starvedCharacter = await removesDeadPermissions(
    interaction,
    starvedUser,
    starvedMember,
    organizedRoles
  );

  return `The **${starvedCharacter}** named ${starvedMember} has died from starvation\n`;
}

async function endGame(interaction, guildId, roles, members) {
  // stop scheduling day and night

  // removing all users game command permissions
  const cursor = await findAllUsers(guildId);
  const allUsers = await cursor.toArray();
  await gameCommandPermissions(interaction, allUsers, false);

  // remove all discord roles from players
  await removeGameRolesFromMembers(members, roles);

  // delete all game info from database
  await deleteAllUsers(guildId);
  await deleteGame(guildId);
  await deleteManyVotes({ guild_id: guildId });
  for (const job in schedule.scheduledJobs) schedule.cancelJob(job);
  await schedule.gracefulShutdown();
}

module.exports = {
  timeScheduling,
  dayTimeJob,
  nightTimeJob,
  removesDeadPermissions,
  starveUser,
  checkGame,
};
