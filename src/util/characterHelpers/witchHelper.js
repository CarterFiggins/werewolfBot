const _ = require("lodash");
const { updateUser, findManyUsers } = require("../../werewolf_db");
const { organizeChannels } = require("../channelHelpers");
const { characters } = require("./characterUtil");
const { removesDeadPermissions, witchCurseDeathMessage, WaysToDie } = require("../deathHelper");

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
        await organizedChannels.witch.send(
          `${members.get(witch.user_id)} Your dark magic has taken effect. You have successfully cursed ${members.get(witch.target_cursed_user_id)}. The power of your curse now looms over them.`
        );
      }
    })
  );
}

async function castWitchCurse(interaction) {
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
        WaysToDie.CURSED
      );
      return await witchCurseDeathMessage({ villager, deadVillager, villagerMember })
    })
  );

  if (deathCharacters) {
    return `The witch's curse has killed:\n${deathCharacters}https://tenor.com/NYMC.gif\n`;
  }
  return "The witch's curse did not kill anyone.\nhttps://tenor.com/TPjK.gif\n";
}

module.exports = {
  castWitchCurse,
  cursePlayers,
};
