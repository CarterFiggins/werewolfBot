const _ = require("lodash");
const { getRole, roleNames } = require("../util/rolesHelpers");

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

module.exports = {
  getPlayingCount,
};
