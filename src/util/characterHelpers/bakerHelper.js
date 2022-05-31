const _ = require("lodash");
const {
  findUsersWithIds,
  findManyUsers,
  updateGame,
} = require("../../werewolf_db");
const { characters } = require("../commandHelpers");
const { removesDeadPermissions } = require("../timeHelper");
const { getAliveUsersIds } = require("../userHelpers");

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

module.exports = {
  starveUser,
  checkBakers,
};
