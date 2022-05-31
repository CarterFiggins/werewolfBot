const _ = require("lodash");
const { getRole, roleNames } = require("../util/rolesHelpers");
const { findManyUsers } = require("../werewolf_db");
const { characters } = require("./commandHelpers");
const { removesDeadPermissions } = require("./deathHelper");

async function getPlayingCount(interaction) {
  let playingRole = await getRole(interaction, roleNames.PLAYING);
  const members = await interaction.guild.members.fetch();

  let playersCount = 0;
  members.forEach((member) => {
    if (member._roles.includes(playingRole.id)) {
      playersCount += 1;
    }
  });
  return playersCount;
}

async function castWitchCurse(interaction, organizedRoles) {
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

module.exports = {
  castWitchCurse,
  getPlayingCount,
};
