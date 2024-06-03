const _ = require("lodash");
const schedule = require("node-schedule");
const {
  updateUser,
  updateGame,
  findManyUsers,
  deleteManyVotes,
  findSettings,
} = require("../werewolf_db");
const {
  organizeChannels,
  removeChannelPermissions,
} = require("./channelHelpers");
const { shuffleSeers } = require("./characterHelpers/seerHelper");
const { characters } = require("./characterHelpers/characterUtil");
const { checkGame } = require("./endGameHelper");
const { organizeRoles } = require("./rolesHelpers");
const { PowerUpNames } = require("./powerUpHelpers");
const { castWitchCurse } = require("./characterHelpers/witchHelper");

async function removesDeadPermissions(
  interaction,
  deadUser,
  deadMember,
  organizedRoles,
) {
  const guildId = interaction.guild.id;
  let deadCharacter = deadUser.character;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const settings = await findSettings(guildId);

  if (deadUser.power_ups[PowerUpNames.SHIELD]) {
    await updateUser(userWhoShot.user_id, interaction.guild.id, {
      [PowerUpNames.SHIELD]: false,
    });
    await deadMember.send("Your life saving shield has been activated, saving you from death. The shield has been consumed and cannot be used again")
    return PowerUpNames.SHIELD
  }

  if (deadCharacter === characters.HUNTER && !deadUser.is_dead && !settings.hunter_guard) {
    await updateUser(deadUser.user_id, guildId, {
      is_injured: true,
      is_dead: true,
    });

    const currentDate = new Date();
    const hours = 4;
    const shootingLimit = new Date(
      currentDate.setHours(currentDate.getHours() + hours)
    );

    schedule.scheduleJob(
      `${guildId}-hunter-${deadUser.user_id}`,
      shootingLimit,
      () => hunterShootingLimitJob(interaction, deadMember)
    );

    if (deadUser.is_vampire && !settings.hard_mode) {
      return `${deadCharacter} (who was a vampire!)`;
    }
    // return early so the hunter doesn't die.
    return deadCharacter;
  }

  // removes deadUser character command and channel Permissions
  deadMember.roles.remove(organizedRoles.alive);
  deadMember.roles.add(organizedRoles.dead);
  await removeChannelPermissions(interaction, deadMember);
  await removeUserVotes(guildId, deadUser.user_id);
  await updateUser(deadUser.user_id, guildId, { is_dead: true });

  if (deadCharacter === characters.BAKER) {
    await checkBakers(guildId, organizedChannels.townSquare);
  } else if (deadCharacter === characters.WEREWOLF && deadUser.is_cub) {
    await updateGame(guildId, {
      wolf_double_kill: true,
    });
    await organizedChannels.werewolves.send(
      `The Werewolf Cub name ${deadMember} has been killed :rage:\nTonight you will be able to target two villagers!\nhttps://tenor.com/86LT.gif`
    );
    deadCharacter = characters.CUB;
  } else if (deadCharacter === characters.SEER) {
    await shuffleSeers(interaction, organizedChannels);
  }

  if (deadUser.is_vampire) {
    if (deadUser.character === characters.VAMPIRE) {
      return `${deadCharacter} vampire`;
    }
    return `${deadCharacter} (who was a vampire!)`;
  }

  return settings.hard_mode ? 'player' : deadCharacter;
}

async function removeUserVotes(guildId, userId) {
  await deleteManyVotes({
    guild_id: guildId,
    $or: [{ user_id: userId }, { voted_user_id: userId }],
  });
}

async function checkBakers(guildId, townSquare) {
  const bakers = await (
    await findManyUsers({
      guild_id: guildId,
      is_dead: false,
      character: characters.BAKER,
    })
  ).toArray();
  if (_.isEmpty(bakers)) {
    await updateGame(guildId, {
      is_baker_dead: true,
    });
    townSquare.send(
      "There is no more bread! One villager will starve every morning"
    );
  }
}

async function gunFire(interaction, targetDbUser, userWhoShot, randomFire = false) {
  if (!randomFire) {
    await interaction.reply(":dart: PEW PEW :gun:");
  }

  const members = await interaction.guild.members.fetch();
  const deadTargetMember = members.get(targetDbUser.user_id);
  const memberWhoShot = members.get(userWhoShot.user_id);
  const allRoles = await interaction.guild.roles.fetch();
  const organizedRoles = organizeRoles(allRoles);

  const deadCharacter = await removesDeadPermissions(
    interaction,
    targetDbUser,
    deadTargetMember,
    organizedRoles
  );

  if (userWhoShot.character === characters.HUNTER && userWhoShot.is_injured) {
    await removesDeadPermissions(
      interaction,
      userWhoShot,
      memberWhoShot,
      organizedRoles
    );
    await updateUser(userWhoShot.user_id, interaction.guild.id, {
      is_injured: false,
    });
  } else {
    await updateUser(userWhoShot.user_id, interaction.guild.id, {
      [PowerUpNames.GUN]: false,
    });
  }

  await sendGunDeathMessage({ interaction, deadCharacter, deadTargetMember, targetDbUser, memberWhoShot, randomFire })
  await checkGame(interaction);
}

async function hunterShootingLimitJob(
  interaction,
  deadHunterMember
) {
  const deadDbHunter = await findUser(
    deadHunterMember.user.id,
    interaction.guild.id
  );
  if (!deadDbHunter.is_injured) {
    return;
  }
  // get all alive users but not the hunter
  let aliveUserIds = await getAliveUsersIds(interaction);

  aliveUserIds = _.filter(aliveUserIds, (id) => id != deadHunterMember.user.id);

  const shotUserId = _.sample(aliveUserIds);
  const shotUser = await findUser(shotUserId, interaction.guild.id);
  const randomFire = true
  await gunFire(interaction, shotUser, deadDbHunter, randomFire)
}

async function sendGunDeathMessage({ interaction, deadCharacter, deadTargetMember, targetDbUser, memberWhoShot, randomFire }) {
  let message = "";
  const userWasProtected = deadCharacter === PowerUpNames.SHIELD;


  if (targetDbUser.character === characters.HUNTER) {
    message = `${deadTargetMember} you have been injured and don't have long to live. Grab you gun and \`/shoot\` someone.`;
  }

  if (randomFire) {
    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);
    let finalMessage = `${memberWhoShot} didn't have time to shoot and died. They dropped their gun and it shot `
    let targetMessage = `the ${deadCharacter} named ${deadTargetMember} \n${message} \n`
    if (userWasProtected) {
      targetMessage = `${deadTargetMember}. The bullet bounced off ${deadTargetMember} and their shield has been consumed`
    }
    await organizedChannels.townSquare.send(`${finalMessage}${targetMessage}`);
  } else {
    let finalMessage = `${memberWhoShot} took aim and shot `
    let targetMessage = `the ${deadCharacter} named ${deadTargetMember} \n${message} \n`
    if (userWasProtected) {
      targetMessage = `${deadTargetMember}. The bullet bounced off ${deadTargetMember} and their shield has been consumed`
    }
    await interaction.editReply(`${finalMessage}${targetMessage}`);
  }
}

async function votingDeathMessage({ interaction, deathCharacter, deadMember, deadUser, topVotes }) {
  const settings = await findSettings(interaction.guild.id);
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const roles = interaction.guild.roles.cache;
  const organizedRoles = organizeRoles(roles);
  if (topVotes.length > 1) {
    message = `There was a tie so I randomly picked ${deadMember} to die\n`;
  } else {
    message = `The town has decided to hang ${deadMember}\n`;
  }

  let cursedMessage = "";

  if (deadUser.character === characters.WITCH) {
    cursedMessage = await castWitchCurse(interaction, organizedRoles);
  }

  let deathMessage = settings.hard_mode ? '' : `The town has killed a **${deathCharacter}**\n`;

  if (deadUser.character === characters.HUNTER) {
    deathMessage = `The town has injured the **${deathCharacter}**\n${deadMember} you don't have long to live. Grab your gun and \`/shoot\` someone.\n`;
  }

  if (deathCharacter === PowerUpNames.SHIELD) {
    deathMessage = `However, ${deadMember} had a protective shield, sparing them from this fate! The shield is now used up and will not offer protection again.`
  }

  await updateGame(guildId, {
    is_day: false,
  });

  await organizedChannels.townSquare.send(
    `${message}${deathMessage}${cursedMessage}\n**It is night time**`
  );
}

async function vampireDeathMessage({ werewolfAttacked, victim, deadCharacter, vampireMember }) {
  if (victim.character === PowerUpNames.SHIELD) {
    return null
  }
  if (werewolfAttacked) {
    if (victim.character === characters.MUTATED) {
      return `The ${deadCharacter} named ${vampireMember} died while in the way of the werewolves\nhttps://tenor.com/5qDD.gif\n`;
    }
    return `The ${deadCharacter} named ${vampireMember} died while in the way of the werewolves killing ${victimMember}\nhttps://tenor.com/5qDD.gif\n`;
  } else {
    return `The ${deadCharacter} named ${vampireMember} tried to suck blood from a werewolf and died\nhttps://tenor.com/sJlV.gif\n`;
  }
} 

async function starveDeathMessage({ starvedCharacter, starvedMember, starvedUser }) {
  if (starvedCharacter === PowerUpNames.SHIELD) {
    return `${starvedMember} was about to starve! But surprise ${starvedMember}'s shield turned into a sandwich and saved the day! The shield (now a tasty snack) is gone.`
  }

  let deadMessage = "has died from starvation";

  if (starvedUser.character === characters.HUNTER) {
    deadMessage =
      "is really hungry and about to die. Quick shoot someone with the `/shoot` command";
  }

  return `The **${starvedCharacter}** named ${starvedMember} ${deadMessage}\n`;
}

async function witchCurseDeathMessage({ villager, deadVillager, villagerMember }) {
  if (deadVillager === PowerUpNames.SHIELD) {
    return `${villagerMember} shield absorbed the curse, turning it into a puff of smoke.`
  }
  let hunterMessage = "";
  if (villager.character === characters.HUNTER) {
    hunterMessage =
      "you don't have long to live. Grab your gun and `/shoot` someone.\n";
  }
  return `The ${deadVillager} named ${villagerMember}. ${hunterMessage}`;
}

async function werewolfKillDeathMessage({ interaction, deadMember, deadUser }) {
  const settings = await findSettings(interaction.guild.id);
  const members = interaction.guild.members.cache;
  const roles = interaction.guild.roles.cache;
  const organizedRoles = organizeRoles(roles);

  const deathCharacter = await removesDeadPermissions(
    interaction,
    deadUser,
    deadMember,
    organizedRoles
  );
  if (deathCharacter === PowerUpNames.SHIELD) { 
    return `Last night the werewolves attacked ${deadMember}. However, ${deadMember} had a shield that protected them from the werwolves attack. Their shield has been consumed`
  }
  
  if (deadUser.character === characters.HUNTER && settings.hunter_guard) {
    const cursorWerewolf = await findManyUsers({
      guild_id: interaction.guild.id,
      character: characters.WEREWOLF,
    });
    const werewolves = await cursorWerewolf.toArray();
    const deadWerewolf = _.sample(werewolves)
    const deadWerewolfMember = members.get(deadWerewolf.user_id);
    const deadWerewolfCharacter = await removesDeadPermissions(
      interaction,
      deadWerewolf,
      deadWerewolfMember,
      organizedRoles,
    );
    if (deadWerewolfCharacter === PowerUpNames.SHIELD) {
      return `Last night the werewolves killed the **${deathCharacter}**\n Before ${deadMember} died they shot at their attacker and hit a werewolves shield! Next time that werewolf won't be so lucky`
    } 
    return `Last night the werewolves killed the **${deathCharacter}**\n Before ${deadMember} died they shot at their attacker and hit the ${deadWerewolfCharacter} named ${deadWerewolfMember}\n`;
  }
  
  if (deadUser.character === characters.HUNTER) { 
     return `Last night the werewolves injured the **${deathCharacter}**\n${deadMember} you don't have long to live. Grab your gun and \`/shoot\` someone.\n`;
  }
  
  return `Last night the **${deathCharacter}** named ${deadMember} was killed by the werewolves.\n`;
}

module.exports = {
  removesDeadPermissions,
  votingDeathMessage,
  gunFire,
  vampireDeathMessage,
  witchCurseDeathMessage,
  starveDeathMessage,
  werewolfKillDeathMessage,
};
