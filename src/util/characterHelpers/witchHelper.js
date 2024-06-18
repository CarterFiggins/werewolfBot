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

module.exports = {
  cursePlayers,
};
