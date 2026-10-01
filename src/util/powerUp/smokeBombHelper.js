const _ = require("lodash");
const { findManyUsers, updateManyUsers } = require("../../werewolf_db");
const { organizeChannels } = require("../channelHelpers");
const { fetchMember } = require("../discordHelpers");
const { sendMemberMessage } = require("../botMessages/sendMemberMessages");

// A smoke bomb lasts from when it is activated at night until the morning.
// While active, no character power (or gun shot) can affect the player.
function isSmokeBombed(dbUser) {
  return !!dbUser?.smoke_bomb_active;
}

async function getSmokeBombedIds(guildId) {
  const cursor = await findManyUsers({
    guild_id: guildId,
    is_dead: false,
    smoke_bomb_active: true,
  });
  const users = await cursor.toArray();
  return _.map(users, (user) => user.user_id);
}

// A smoke bomb set up during the day goes off when night starts (after the hanging).
async function activateArmedSmokeBombs(interaction) {
  const guildId = interaction.guild.id;
  const cursor = await findManyUsers({
    guild_id: guildId,
    is_dead: false,
    smoke_bomb_armed: true,
  });
  const armedUsers = await cursor.toArray();

  await updateManyUsers(
    { guild_id: guildId, is_dead: false, smoke_bomb_armed: true },
    { smoke_bomb_active: true, smoke_bomb_armed: false }
  );
  // Clear any left over from players who died before night (e.g. hanged).
  await updateManyUsers(
    { guild_id: guildId, smoke_bomb_armed: true },
    { smoke_bomb_armed: false }
  );

  const organizedChannels = organizeChannels(interaction.guild.channels.cache);
  for (const user of armedUsers) {
    const member = await fetchMember(interaction, user.user_id);
    await sendMemberMessage(member, "💨 Night has fallen and your smoke bomb went off! Until morning no character power will work on you, and any gun shot at you will miss.");
    await organizedChannels.afterLife?.send(`💨 ${member || user.nickname || user.name}'s smoke bomb went off and they disappeared for the night 💨`);
  }
}

async function removeSmokeBombs(interaction) {
  await updateManyUsers(
    {
      guild_id: interaction.guild.id,
      smoke_bomb_active: true,
    },
    {
      smoke_bomb_active: false,
    }
  );
}

module.exports = {
  isSmokeBombed,
  getSmokeBombedIds,
  activateArmedSmokeBombs,
  removeSmokeBombs,
};
