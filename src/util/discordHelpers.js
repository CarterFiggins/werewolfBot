const { getRole, roleNames } = require("./rolesHelpers");

async function fetchMember(interaction, userId) {
  if (!userId) return null;
  const cached = interaction.guild.members.cache.get(userId);
  if (cached) return cached;
  try {
    return await interaction.guild.members.fetch(userId);
  } catch (err) {
    console.warn(`fetchMember: could not fetch member ${userId} in guild ${interaction.guild.id}: ${err.message}`);
    return null;
  }
}

const FULL_FETCH_TTL_MS = 60000;
const lastFullFetchByGuild = new Map();

// A full fetch fills the cache, so we fetch at most once per TTL and always read from the cache.
async function fetchMembers(interaction, roleId) {
  const guild = interaction.guild;
  const now = Date.now();
  if (now - (lastFullFetchByGuild.get(guild.id) || 0) > FULL_FETCH_TTL_MS) {
    try {
      await guild.members.fetch();
      lastFullFetchByGuild.set(guild.id, now);
    } catch (err) {
      console.warn(`fetchMembers: full fetch failed in guild ${guild.id}, using cache: ${err.message}`);
    }
  }
  if (!roleId) return guild.members.cache;
  return guild.members.cache.filter((member) => member.roles.cache.has(roleId));
}

async function getAliveMembers(interaction, getId) {
  const aliveRole = await getRole(interaction, roleNames.ALIVE);
  const aliveMembers = await fetchMembers(interaction, aliveRole.id);
  return getId ? aliveMembers.map((member) => member.user.id) : aliveMembers.map((member) => member);
}

async function getAliveUsersIds(interaction) {
  return getAliveMembers(interaction, true);
}

module.exports = {
  getAliveUsersIds,
  getAliveMembers,
  fetchMember,
  fetchMembers,
};
