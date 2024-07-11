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
    return characters.VILLAGER
  }

  return copiedCharacter
}

async function copy(interaction, doppelgangerUserId, copyUserId) {
  const guildId = interaction.guild.id;
  const members = interaction.guild.members.cache;
  let copiedCharacter;
  if (!copyUserId) {
    copiedCharacter = (await randomUser(guildId)).character;
  } else {
    const originalUser = await findUser(copyUserId, guildId);
    copiedCharacter = originalUser.assigned_identity;
  }

  copiedCharacter = validateCopiedCharacter(copiedCharacter)

  const copiedVampire = copiedCharacter === characters.VAMPIRE;

  await updateUser(doppelgangerUserId, guildId, {
    character: copiedCharacter,
    first_bite: copiedVampire,
  });

  const doppelgangerMember = members.get(doppelgangerUserId);
  const copiedMember = members.get(copyUserId);
  const organizedChannels = await giveChannelPermissions({
    interaction,
    user: doppelgangerMember,
    character: copiedCharacter,
    message: characters.VILLAGER === copiedCharacter ? null : `The doppelganger ${doppelgangerMember} has joined`,
  });

  let isVampire = "";
  if (copiedVampire) {
    isVampire = "vampire ";
  }

  await organizedChannels.afterLife.send(
    `${doppelgangerMember} has copied ${copiedMember} and has become a ${isVampire}${copiedCharacter}`
  );

  try {
    await doppelgangerMember.send(
      `You are now a ${isVampire} ${copiedCharacter}`
    );
  } catch (e) {
    console.log(e);
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
