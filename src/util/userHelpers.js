const { getRole, roleNames } = require("../util/rolesHelpers");

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

async function getAliveUsersIds(interaction) {
  return getAliveMembers(interaction, true);
}

module.exports = {
  getAliveUsersIds,
  getAliveMembers,
};
