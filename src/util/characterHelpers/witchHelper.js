const _ = require("lodash");
const { updateUser, findManyUsers } = require("../../werewolf_db");
const { organizeChannels } = require("../channelHelpers");
const { characters } = require("../commandHelpers");
const { removesDeadPermissions } = require("../deathHelper");

async function cursePlayers(interaction) {
  const guildId = interaction.guild.id;
  const members = interaction.guild.members.cache;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const cursorWitches = await findManyUsers({
    guild_id: guildId,
    character: characters.WITCH,
  });
  const witches = await cursorWitches.toArray();

  await Promise.all(
    _.map(witches, async (witch) => {
      if (witch.target_cursed_user_id) {
        await updateUser(witch.target_cursed_user_id, guildId, {
          is_cursed: true,
        });
        await updateUser(witch.user_id, guildId, {
          target_cursed_user_id: null,
        });
        organizedChannels.witch.send(
          `${members.get(witch.user_id)} have successfully cursed ${members.get(
            witch.target_cursed_user_id
          )}`
        );
      }
    })
  );
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
      if (villager.character === characters.HUNTER) {
        hunterMessage =
          "you don't have long to live. Grab your gun and `/shoot` someone.";
      }
      return `The ${deadVillager} named ${villagerMember}. ${hunterMessage}\n`;
    })
  );

  if (deathCharacters) {
    return `The witch's curse has killed:\n${deathCharacters}https://tenor.com/NYMC.gif`;
  }
  return "The witch's curse did not kill anyone.\nhttps://tenor.com/TPjK.gif";
}

module.exports = {
  castWitchCurse,
  cursePlayers,
};
