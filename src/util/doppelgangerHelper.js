const { findUser, updateUser, findAllUsers } = require("../werewolf_db");
const { giveChannelPermissions } = require("./channelHelpers");
const { characters } = require("./commandHelpers");

async function copyCharacter(interaction, doppelgangerUserId, copyUserId) {
  const guildId = interaction.guild.id;
  let copiedCharacter;
  if (!copyUserId) {
    copiedCharacter = await randomUser(interaction).character;
  } else {
    const originalUser = await findUser(copyUserId, guildId);
    copiedCharacter = originalUser.character;
  }

  copiedCharacter =
    copiedCharacter === characters.DOPPELGANGER
      ? characters.VILLAGER
      : copiedCharacter;

  await updateUser(doppelgangerUserId, guildId, {
    character: copiedCharacter,
  });

  const doppelgangerMember =
    interaction.guild.members.cache.get(doppelgangerUserId);
  const organizedChannels = await giveChannelPermissions({
    interaction,
    user: doppelgangerMember,
    character: copiedCharacter,
    message: `The doppelganger ${doppelgangerMember} has joined`,
  });

  await organizedChannels.afterLife.send(
    `${doppelgangerMember} has become a ${copiedCharacter}`
  );
}

async function randomUser(guildId) {
  const cursor = await findAllUsers(guildId);
  const users = await cursor.toArray();
  return _.head(_.shuffle(users));
}

module.exports = {
  copyCharacter,
};
