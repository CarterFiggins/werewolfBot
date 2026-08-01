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

async function getAliveMembers(interaction, getId) {
  let aliveRole = await getRole(interaction, roleNames.ALIVE);
  const members = interaction.guild.members.cache;

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

async function getAliveUsersIds(interaction) {
  return getAliveMembers(interaction, true);
}

module.exports = {
  getAliveUsersIds,
  getAliveMembers,
  fetchMember,
};
