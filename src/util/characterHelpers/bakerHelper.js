const _ = require("lodash");
const { findUsersWithIds } = require("../../werewolf_db");
const { characters } = require("./characterUtil");
const { removesDeadPermissions } = require("../deathHelper");
const { getAliveUsersIds } = require("../discordHelpers");
const { starveDeathMessage } = require("../deathMessages");

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
        !user.is_vampire &&
        user.character !== characters.HUNTER
    );
  } else {
    aliveUsers = _.filter(
      aliveUsers,
      (user) =>
        user.character !== characters.WEREWOLF &&
        !user.is_vampire &&
        user.character !== characters.HUNTER
    );
  }

  const starvedUser = _.sample(aliveUsers);

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

  return await starveDeathMessage({ starvedCharacter, starvedMember, starvedUser })
}

module.exports = {
  starveUser,
};
