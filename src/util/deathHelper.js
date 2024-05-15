const _ = require("lodash");
const schedule = require("node-schedule");
const {
  updateUser,
  updateGame,
  findManyUsers,
  findUser,
  deleteManyVotes,
  findSettings,
} = require("../werewolf_db");
const {
  organizeChannels,
  removeChannelPermissions,
} = require("./channelHelpers");
const { shuffleSeers } = require("./characterHelpers/seerHelper");
const { characters } = require("./commandHelpers");
const { getAliveUsersIds } = require("./discordHelpers");

async function removesDeadPermissions(
  interaction,
  deadUser,
  deadMember,
  organizedRoles,
  hunterGuard,
) {
  const guildId = interaction.guild.id;
  let deadCharacter = deadUser.character;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const settings = await findSettings(guildId);
  if (deadCharacter === characters.HUNTER && !deadUser.is_dead && !hunterGuard) {
    await updateUser(deadUser.user_id, guildId, {
      can_shoot: true,
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
      () => hunterShootingLimitJob(interaction, deadMember, organizedRoles)
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

  const shotUserId = _.sample(aliveUserIds);
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
  if (shotUser.character === characters.HUNTER) {
    message = `${shotMember} you have been injured and don't have long to live. Grab you gun and \`/shoot\` someone.\n`;
  }
  await organizedChannels.townSquare.send(
    `${deadHunterMember} didn't have time to shoot and died. They dropped their gun and it shot the ${deadCharacter} named ${shotMember}\n${message}\n`
  );
  await checkGame(interaction);
}

module.exports = {
  removesDeadPermissions,
};
