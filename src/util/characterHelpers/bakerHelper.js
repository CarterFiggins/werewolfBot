const _ = require("lodash");
const { findUsersWithIds } = require("../../werewolf_db");
const { characters } = require("../commandHelpers");
const { removesDeadPermissions } = require("../deathHelper");
const { getAliveUsersIds } = require("../discordHelpers");

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
        !user.is_vampire
    );
  } else {
    aliveUsers = _.filter(
      aliveUsers,
      (user) => user.character !== characters.WEREWOLF
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

  let deadMessage = "has died from starvation";

  if (starvedUser.character === characters.HUNTER) {
    deadMessage =
      "is really hungry and about to die. Quick shoot someone with the `/shoot` command";
  }

  return `The **${starvedCharacter}** named ${starvedMember} ${deadMessage}\n`;
}

module.exports = {
  starveUser,
};
