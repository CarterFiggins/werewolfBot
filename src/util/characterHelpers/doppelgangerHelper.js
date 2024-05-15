const _ = require("lodash");
const { findUser, updateUser, findManyUsers } = require("../../werewolf_db");
const { giveChannelPermissions } = require("../channelHelpers");
const { characters } = require("../commandHelpers");

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

async function copy(interaction, doppelgangerUserId, copyUserId) {
  const guildId = interaction.guild.id;
  const members = interaction.guild.members.cache;
  let copiedCharacter;
  if (!copyUserId) {
    copiedCharacter = (await randomUser(guildId)).character;
  } else {
    const originalUser = await findUser(copyUserId, guildId);
    copiedCharacter = originalUser.character;
  }

  let displayInGameCharacter = copiedCharacter
  if (displayInGameCharacter === characters.LYCAN || displayInGameCharacter === characters.MUTATED ) {
    displayInGameCharacter = characters.VILLAGER
  } else if (displayInGameCharacter === characters.FOOL) {
    displayInGameCharacter = characters.SEER
  }

  copiedCharacter =
    copiedCharacter === characters.DOPPELGANGER
      ? characters.VILLAGER
      : copiedCharacter;

  const copiedVampire = copiedCharacter === characters.VAMPIRE;

  await updateUser(doppelgangerUserId, guildId, {
    character: copiedCharacter,
    first_bite: copiedVampire,
  });

  const doppelgangerMember = members.get(doppelgangerUserId);
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
    `${doppelgangerMember} has become a ${isVampire}${copiedCharacter}`
  );

  try {
    await doppelgangerMember.send(
      `You are now a ${isVampire} ${displayInGameCharacter}`
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
