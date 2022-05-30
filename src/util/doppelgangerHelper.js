const { findUser, updateUser } = require("../werewolf_db");

async function copyCharacter(interaction, copyUserId, originalUserId) {
  const guildId = interaction.guild.id;
  const originalUser = await findUser(originalUserId, guildId);

  await updateUser(copyUserId, guildId, {
    character: originalUser.character,
  });
}

module.exports = {
  copyCharacter,
};
