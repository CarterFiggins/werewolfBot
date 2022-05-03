const _ = require("lodash");
const { getRole, roleNames } = require("../util/rolesHelpers");
const { findManyUsers, deleteManyVotes } = require("../werewolf_db");
const { characters } = require("./commandHelpers");

async function getAliveMembers(interaction, getId) {
  let aliveRole = await getRole(interaction, roleNames.ALIVE);
  const members = await interaction.guild.members.fetch();

  return members
    .map((member) => {
      if (member._roles.includes(aliveRole.id)) {
        if (getId) {
          return member.user.id;
        } else {
          return member;
        }
      }
    })
    .filter((m) => m);
}

async function getPlayingCount(interaction) {
  let playingRole = await getRole(interaction, roleNames.PLAYING);
  const members = await interaction.guild.members.fetch();

  let playersCount = 0;
  members.forEach((member) => {
    console.log(member);
    if (member._roles.includes(playingRole.id)) {
      playersCount += 1;
    }
  });
  return playersCount;
}

async function getAliveUsersIds(interaction) {
  return getAliveMembers(interaction, true);
}

async function castWitchCurse(
  interaction,
  organizedRoles,
  removesDeadPermissions
) {
  const cursorCursed = await findManyUsers({
    guild_id: interaction.guild.id,
    is_cursed: true,
    is_dead: false,
  });
  const cursedPlayers = await cursorCursed.toArray();
  const cursedVillagers = _.filter(cursedPlayers, (player) => {
    return player.character !== characters.WEREWOLF;
  });
  const members = interaction.guild.members.cache;

  const deathCharacters = await Promise.all(
    _.map(cursedVillagers, async (villager) => {
      const villagerMember = members.get(villager.user_id);

      const deadVillager = await removesDeadPermissions(
        interaction,
        villager,
        villagerMember,
        organizedRoles
      );
      let hunterMessage = "";
      if (deadVillager === characters.HUNTER) {
        hunterMessage =
          "you don't have long to live. Grab your gun and `/shoot` someone.";
      }
      return `The ${
        villager.is_vampire ? `vampire ${deadVillager}` : deadVillager
      } named ${villagerMember}. ${hunterMessage}\n`;
    })
  );

  if (deathCharacters) {
    return `The witch's curse has killed:\n${deathCharacters}https://tenor.com/NYMC.gif`;
  }
  return "The witch's curse did not kill anyone.\nhttps://tenor.com/TPjK.gif";
}

async function removeUserVotes(guildId, userId) {
  await deleteManyVotes({
    guild_id: guildId,
    $or: [{ user_id: userId }, { voted_user_id: userId }],
  });
}

module.exports = {
  getAliveUsersIds,
  getAliveMembers,
  castWitchCurse,
  removeUserVotes,
  getPlayingCount,
};
