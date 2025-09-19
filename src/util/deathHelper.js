const _ = require("lodash");
const schedule = require("node-schedule");
const {
  updateUser,
  updateGame,
  findManyUsers,
  deleteManyVotes,
  findSettings,
  findOneUser,
  findUser,
  findUsersWithIds,
} = require("../werewolf_db");
const {
  organizeChannels,
  removeChannelPermissions,
} = require("./channelHelpers");
const { handleApprenticeSeer } = require("./characterHelpers/seerHelper");
const { characters } = require("./characterHelpers/characterUtil");
const { checkGame } = require("./endGameHelper");
const { organizeRoles } = require("./rolesHelpers");
const { PowerUpNames, usePowerUp} = require("./powerUpHelpers");
const { getAliveUsersIds } = require("./discordHelpers");
const { sendMemberMessage } = require("./botMessages/sendMemberMessages");

const WaysToDie = {
  HANGED: 'Hanged',
  WEREWOLF: 'Werewolf',
  SHOT: 'Shot',
  CURSED: 'Cursed',
  STARVED: 'Starved',
  CHAOS: 'Failed At Causing Chaos',
  BROKEN_HEART: 'Broken Heart',
}

async function removesDeadPermissions(
  interaction,
  deadUser,
  deadMember,
  causeOfDeath,
) {
  const guildId = interaction.guild.id;
  let deadCharacter = deadUser.character; 
  const settings = await findSettings(guildId);

  if (deadUser?.power_ups && deadUser?.power_ups[PowerUpNames.SHIELD] && causeOfDeath !== WaysToDie.BROKEN_HEART) {
    await usePowerUp(deadUser, interaction, PowerUpNames.SHIELD);
    await sendMemberMessage(deadMember, "🛡️Your life saving shield has been activated, saving you from death. The shield has been consumed and cannot be used again🛡️")
    return PowerUpNames.SHIELD
  }

  const hunterGuardActivated =  settings.hunter_guard && causeOfDeath === WaysToDie.WEREWOLF

  if (deadCharacter === characters.HUNTER && !deadUser.is_dead && !hunterGuardActivated) {
    await updateUser(deadUser.user_id, guildId, {
      is_injured: true,
      is_dead: true,
      cause_of_death: causeOfDeath,
    });

    const currentDate = new Date();
    const hours = 11;
    const shootingLimit = new Date(
      currentDate.setHours(currentDate.getHours() + hours)
    );

    schedule.scheduleJob(
      `${guildId}-hunter-${deadUser.user_id}`,
      shootingLimit,
      () => hunterShootingLimitJob(interaction, deadMember)
    );

    if (deadUser.is_vampire) {
      return `${deadCharacter} (who was a vampire!)`;
    }
    // return early so the hunter doesn't die.
    return deadCharacter;
  }

  await removePlayer(
    interaction,
    deadUser,
    deadMember,
    causeOfDeath
  )

  deadCharacter = await handleCharactersDeath(interaction, deadCharacter, deadUser, deadMember)

  if (deadUser?.is_chaos_target && causeOfDeath !== WaysToDie.HANGED) {
    await killChaosDemon(interaction, deadMember)
  }

  if (!_.isEmpty(deadUser?.in_love_with_ids)) {
    const cursorInLoveWith = await findManyUsers({
      guild_id: guildId,
      user_id: { $in: deadUser.in_love_with_ids },
      is_dead: false,
    });
    const loverDbUsers = await cursorInLoveWith.toArray();

    for (const loverDbUser of loverDbUsers) {
      // Don't kill demon if lover is target.
      const loverHangedByChaosDemon = loverDbUser.chaos_target_user_id === deadUser.user_id && causeOfDeath === WaysToDie.HANGED
      if (!loverDbUser.is_dead && !loverHangedByChaosDemon) {
        await killLover(interaction, loverDbUser, deadMember);
      }
    }
  }

  return deadCharacter
}

async function handleCharactersDeath(interaction, deadCharacter, deadUser, deadMember) {
  const guildId = interaction.guild.id;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);

  if (deadCharacter === characters.BAKER) {
    await checkBakers(interaction);
  } else if (deadCharacter === characters.WEREWOLF && deadUser.is_cub) {
    await updateGame(guildId, {
      wolf_double_kill: true,
    });
    await organizedChannels?.werewolves?.send(
      `We have unfortunate news: ${deadMember}, our cub, has been killed. However, this loss has fueled your rage.:rage:\n Tonight, you can target not just one, but two villagers.\nhttps://tenor.com/86LT.gif`
    );
    deadCharacter = characters.CUB;
  } else if (deadCharacter === characters.SEER) {
    await handleApprenticeSeer(interaction, deadUser);
  }

  if (deadUser.is_vampire) {
    if (deadUser.character === characters.VAMPIRE) {
      return `${deadCharacter} vampire`;
    }
    return `${deadCharacter} (who was a vampire!)`;
  }

  if (deadUser.is_henchman) {
    return `${deadCharacter} (who was the henchman!)`;
  }

  return deadCharacter;
}

async function removePlayer(
  interaction,
  deadUser,
  deadMember,
  causeOfDeath
) {
  const guildId = interaction.guild.id;
  const roles = await interaction.guild.roles.fetch();
  await deadMember.fetch()
  const organizedRoles = organizeRoles(roles);

  await deadMember.roles.remove(organizedRoles.alive);
  await deadMember.roles.add(organizedRoles.dead);
  await removeChannelPermissions(interaction, deadMember);
  await removeUserVotes(guildId, deadUser.user_id);
  await updateUser(deadUser.user_id, guildId, { is_dead: true, cause_of_death: causeOfDeath });
}

async function killChaosDemon(interaction, targetMember) {
  const members = interaction.guild.members.cache;
  const cursorChaosDemons = await findManyUsers({
    guild_id: interaction.guild.id,
    character: characters.CHAOS_DEMON,
    is_dead: false,
  })
  const chaosDemons = await cursorChaosDemons.toArray();

  if (_.isEmpty(chaosDemons)) {
    return;
  }

  for (const chaosDemon of chaosDemon) {
    const chaosDemonMember = members.get(chaosDemon.user_id)
  
    await removePlayer(
      interaction,
      chaosDemon,
      chaosDemonMember,
      WaysToDie.CHAOS
    )
    interaction.townAnnouncements.push(`## * In a twist of fate, the Chaos Demon, ${chaosDemonMember}, has met their end! Their sinister plan failed because their marked target, ${targetMember}, died, but not by hanging. Without their target's demise by lynching, the Chaos Demon's power has been vanquished.`)
  }
}

function randomLoversDeathMessage(loverMember, loversCharacter, deadUserMember) {
  const messages = [
    `## * A chilling wail echoes through the night! ${loverMember}, the ${loversCharacter}, has perished of a broken heart after the loss of ${deadUserMember}.`,
    `## * The silence is shattered by a mournful cry. ${loverMember}, the ${loversCharacter}, could not bear the grief of losing ${deadUserMember}, and has joined them in death.`,
    `## * Love's bond proves stronger than life itself. ${loverMember}, the ${loversCharacter}, has succumbed to sorrow, following ${deadUserMember} into the darkness.`,
    `## * Heartbreak takes its toll ${loverMember}, the ${loversCharacter}, has passed on, unable to live without ${deadUserMember}.`,
  ]
  return _.sample(messages)
}

async function killLover(interaction, loverDbUser, deadUserMember) {
  const members = interaction.guild.members.cache;
  const loverMember = members.get(loverDbUser.user_id)

  interaction.townAnnouncements.push(randomLoversDeathMessage(loverMember, loversCharacter, deadUserMember))

  const loversCharacter = await removesDeadPermissions(
    interaction,
    loverDbUser,
    loverMember,
    WaysToDie.BROKEN_HEART
  );
}

async function removeUserVotes(guildId, userId) {
  await deleteManyVotes({
    guild_id: guildId,
    $or: [{ user_id: userId }, { voted_user_id: userId }],
  });
}

async function checkBakers(interaction) {
  const bakers = await (
    await findManyUsers({
      guild_id: interaction.guild.id,
      is_dead: false,
      character: characters.BAKER,
    })
  ).toArray();
  if (_.isEmpty(bakers)) {
    await updateGame(interaction.guild.id, {
      is_baker_dead: true,
    });
    interaction.townAnnouncements.push(`## * Hold onto your hats, because we've got a loafing crisis on our hands! Our baker has bitten the baguette, leaving us with fewer carbs than a gluten-free cookbook. Starting tomorrow, one unlucky villager will face the dreaded "empty stomach o'doom" and, well, let's just say it won't end well.`)
  }
}

async function gunFire(interaction, targetDbUser, userWhoShot, randomFire = false) {
  if (!randomFire) {
    await interaction.reply(":dart: PEW PEW :gun:");
  }
  interaction.townAnnouncements = [];

  const members = await interaction.guild.members.fetch();
  const deadTargetMember = members.get(targetDbUser.user_id);
  const memberWhoShot = members.get(userWhoShot.user_id);

  const deadCharacter = await removesDeadPermissions(
    interaction,
    targetDbUser,
    deadTargetMember,
    WaysToDie.SHOT
  );

  if (userWhoShot.character === characters.HUNTER && userWhoShot.is_injured) {
    await removesDeadPermissions(
      interaction,
      userWhoShot,
      memberWhoShot,
      userWhoShot.cause_of_death
    );
    await updateUser(userWhoShot.user_id, interaction.guild.id, {
      is_injured: false,
    });
  } else {
    await usePowerUp(userWhoShot, interaction, PowerUpNames.GUN)
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

async function werewolfKillDeathMessage({ interaction, deadMember, deadUser }) {
  const settings = await findSettings(interaction.guild.id);
  const members = interaction.guild.members.cache;

  const deathCharacter = await removesDeadPermissions(
    interaction,
    deadUser,
    deadMember,
    WaysToDie.WEREWOLF
  );
  if (deathCharacter === PowerUpNames.SHIELD) { 
    return `🛡️Last night the werewolves attacked a villager. However, the villager had a shield that protected them from the werewolf attack. Their shield has been consumed🛡️`;
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
      WaysToDie.SHOT
    );
    if (deadWerewolfCharacter === PowerUpNames.SHIELD) {
      return `🛡️Last night the werewolves killed the **${deathCharacter}**\n Before ${deadMember} died they shot at their attacker and hit a werewolves shield! Next time that werewolf won't be so lucky🛡️`
    } 
    return `Last night the werewolves killed the **${deathCharacter}**\n Before ${deadMember} died they shot at their attacker and hit the ${deadWerewolfCharacter} named ${deadWerewolfMember}\n`;
  }
  
  if (deadUser.character === characters.HUNTER) { 
     return `Last night, the werewolves attacked and injured the **${deathCharacter}**, ${deadMember}. Despite their injuries, the hunter has one last chance to fight back. ${deadMember} now has the opportunity to shoot any player with their gun before succumbing to their wounds.\nChoose wisely, ${deadMember}. The fate of the village may rest on your final shot.\n`;
  }
  
  return `Last night, ${deadMember} was found dead, playing the character of ${deathCharacter}. They have been killed by a werewolf attack.\n`;
}

async function sendGunDeathMessage({ interaction, deadCharacter, deadTargetMember, targetDbUser, memberWhoShot, randomFire }) {
  let message = "";
  const userWasProtected = deadCharacter === PowerUpNames.SHIELD;


  if (targetDbUser.character === characters.HUNTER && !userWasProtected) {
    message = `${deadTargetMember} you have been injured and don't have long to live. Grab you gun and \`/shoot\` someone.`;
  }

  if (targetDbUser.character === characters.WITCH && !userWasProtected) {
    message += await castWitchCurse(interaction)
  }

  if (randomFire) {
    let finalMessage = `${memberWhoShot} didn't have time to shoot and died. They dropped their gun and it shot `
    let targetMessage = `the ${deadCharacter} named ${deadTargetMember} \n${message} \n`
    if (userWasProtected) {
      targetMessage = `🛡️${deadTargetMember}. The bullet bounced off ${deadTargetMember} and their shield has been consumed🛡️`
    }
    interaction.townAnnouncements.push(`## * ${finalMessage}${targetMessage}`);
  } else {
    let finalMessage = `${memberWhoShot} took aim and shot `
    let targetMessage = `the ${deadCharacter} named ${deadTargetMember} \n${message} \n`
    if (userWasProtected) {
      targetMessage = `🛡️${deadTargetMember}. The bullet bounced off ${deadTargetMember} and their shield has been consumed🛡️`
    }
    await interaction.editReply(`${finalMessage}${targetMessage}`);
  }
}

async function witchCurseDeathMessage({ villager, deadVillager, villagerMember }) {
  if (deadVillager === PowerUpNames.SHIELD) {
    return `* 🛡️A villager's shield absorbed the curse, turning it into a puff of smoke.🛡️\n`
  }
  let hunterMessage = "";
  if (villager.character === characters.HUNTER) {
    hunterMessage =
      " You don't have long to live. Grab your gun and `/shoot` someone.\n";
  }
  return `* The ${deadVillager} named ${villagerMember}.${hunterMessage}\n`;
}

async function botShoots(interaction) {
  let aliveUserIds = await getAliveUsersIds(interaction);
  const cursor = await findUsersWithIds(interaction.guild.id, aliveUserIds);
  let aliveUsers = await cursor.toArray();
  const unluckyDbUser = _.sample(aliveUsers)

  const unluckyMember = interaction.guild.members.cache.get(
    unluckyDbUser.user_id
  );

  const botShotCharacter = await removesDeadPermissions(
    interaction,
    unluckyDbUser,
    unluckyMember,
    WaysToDie.SHOT
  );

  if (botShotCharacter === PowerUpNames.SHIELD) {
    interaction.townAnnouncements.push("## * 🛡️Guess what? I've got a gun! I took aim and fired at a villager, but surprise — they had a shield! Consider this a warning shot. Watch your back, because next time, I won't miss!🛡️")
    return
  }

  const responses = [
    `Guess what? I've got a gun! I took aim and fired at ${unluckyMember}. I'm mad with power! The ${botShotCharacter} is dead!`,
    `I'm pleased to announce a surprising turn of events—I now wield a gun! With unerring aim, I fired upon ${unluckyMember}, and alas, The ${botShotCharacter} has met their untimely demise.`,
    `I've just been handed a gun! Taking careful aim, I fired at ${unluckyMember} and brought the ${botShotCharacter}'s journey to an abrupt end!`,
    `I've acquired a firearm! Taking aim, I shot ${unluckyMember}. The ${botShotCharacter} is now out of the game!`,
    `Hold onto your hats, folks! Guess who's packing heat? That's right, it's me with a shiny new gun! Fired off a shot at ${unluckyMember} and voila! The ${botShotCharacter} is now a ghost!`,
    `Guess what, folks? I've only gone and snagged myself a gun! Took a shot at ${unluckyMember}, and poof! The ${botShotCharacter} is toast!`
  ]

  interaction.townAnnouncements.push(`## * ${_.sample(responses)}`)
}


async function castWitchCurse(interaction) {
  const cursorCursed = await findManyUsers({
    guild_id: interaction.guild.id,
    is_cursed: true,
    is_dead: false,
  });
  const cursedPlayers = await cursorCursed.toArray();
  const cursedVillagers = _.filter(cursedPlayers, (player) => {
    return player.character !== characters.WEREWOLF && player.character !== characters.WITCH;
  });
  const members = interaction.guild.members.cache;

  const deathCharacters = await Promise.all(
    _.map(cursedVillagers, async (villager) => {
      const villagerMember = members.get(villager.user_id);

      const deadVillager = await removesDeadPermissions(
        interaction,
        villager,
        villagerMember,
        WaysToDie.CURSED
      );
      return await witchCurseDeathMessage({ villager, deadVillager, villagerMember })
    })
  );

  if (!_.isEmpty(deathCharacters)) {
    return `## The witch's curse has killed:\n${deathCharacters}https://tenor.com/NYMC.gif\n`;
  }
  return "## The witch's curse did not kill anyone.\nhttps://tenor.com/TPjK.gif\n";
}

module.exports = {
  removesDeadPermissions,
  gunFire,
  WaysToDie,
  witchCurseDeathMessage,
  werewolfKillDeathMessage,
  castWitchCurse,
  botShoots,
  removeUserVotes,
};
