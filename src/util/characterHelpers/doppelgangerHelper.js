const _ = require("lodash");
const { findUser, updateUser, findManyUsers } = require("../../werewolf_db");
const { giveChannelPermissions } = require("../channelHelpers");
const { characters } = require("./characterUtil");

async function copyCharacters(interaction) {
  const cursorDoppelganger = await findManyUsers({
    guild_id: interaction.guild.id,
    character: characters.DOPPELGANGER,
  });

  const doppelgangers = await cursorDoppelganger.toArray();
  await Promise.all(
    _.map(doppelgangers, async (doppelganger) => {
      await copy(interaction, doppelganger.user_id, doppelganger.copy_user_id);
    })
  );
}

function validateCopiedCharacter(copiedCharacter) {
  if (copiedCharacter === characters.CHAOS_DEMON) {
    return characters.DOPPELGANGER
  }

  if (copiedCharacter === characters.CUB) {
    return characters.WEREWOLF
  }

  return copiedCharacter
}

async function copy(interaction, doppelgangerUserId, copyUserId) {
  const guildId = interaction.guild.id;
  const members = interaction.guild.members.cache;
  let copiedUserDb;
  if (!copyUserId) {
    copiedUserDb = await randomUser(guildId)
    copyUserId = copiedUserDb.user_id
  } else {
    copiedUserDb = await findUser(copyUserId, guildId);
  }
  const copiedCharacter = validateCopiedCharacter(copiedUserDb.character)
  const copiedAssignedIdentity = validateCopiedCharacter(copiedUserDb.assigned_identity)

  const copiedVampireKing = copiedCharacter === characters.VAMPIRE;
  const copiedWerewolf = copiedCharacter === characters.WEREWOLF;


  const userData = {
    character: copiedCharacter,
    first_bite: copiedVampireKing,
    is_vampire: copiedUserDb.is_vampire,
    is_cub: copiedUserDb.is_cub,
    copy_user_id: null,
  }

  if (copiedWerewolf) {
    userData.kill_targeted_user_ids = [];
  }

  await updateUser(doppelgangerUserId, guildId, userData);

  const doppelgangerMember = members.get(doppelgangerUserId);
  const copiedMember = members.get(copyUserId);
  const organizedChannels = await giveChannelPermissions({
    interaction,
    user: doppelgangerMember,
    character: copiedCharacter,
    message: characters.VILLAGER === copiedCharacter ? null : `The doppelganger ${doppelgangerMember} has joined`,
    joiningDbUser: copiedUserDb,
  });

  let isVampire = "";
  if ( copiedUserDb.is_vampire) {
    isVampire = "vampire ";
  }

  await organizedChannels.afterLife.send(
    `${doppelgangerMember} has copied ${copiedMember} and has become a ${isVampire}${copiedCharacter}`
  );

  try {
    await doppelgangerMember.send(
      `You are now a ${isVampire}${copiedAssignedIdentity}`
    );
  } catch (e) {
    console.error(e);
    console.log("Failed to send doppelganger new character message");
  }
}

async function randomUser(guildId) {
  const cursor = await findManyUsers({
    guild_id: guildId,
    character: { $not: new RegExp(characters.DOPPELGANGER, "g") },
  });
  const users = await cursor.toArray();
  return _.sample(users);
}

module.exports = {
  copyCharacters,
};
