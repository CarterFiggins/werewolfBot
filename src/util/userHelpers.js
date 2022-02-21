const { getRole, roleNames } = require("../util/rolesHelpers");

async function getAliveUsersIds(interaction, getId) {
  let aliveRole = await getRole(interaction, roleNames.ALIVE);
  const members = await interaction.guild.members.fetch();

  return members
    .map((member) => {
      if (member._roles.includes(aliveRole.id)) {
        return member.user.id;
      }
    })
    .filter((m) => m);
}

module.exports = {
  getAliveUsersIds,
};
