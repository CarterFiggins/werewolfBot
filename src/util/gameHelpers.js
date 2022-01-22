const _ = require("lodash");

const roleNames = {
  PLAYING: "Playing",
  ALIVE: "Alive",
  DEAD: "Dead",
};

async function getPlayingUsers(interaction) {
  const roles = await interaction.guild.roles.fetch();
  let playingRoleId = null;

  roles.forEach((role) => {
    if (role.name === roleNames.PLAYING) {
      playingRoleId = role.id;
    }
  });

  if (!playingRoleId) {
    throw new Error("No playing role created");
  }

  const members = await interaction.guild.members.fetch();
  const playingUsers = members
    .map((member) => {
      if (member._roles.includes(playingRoleId)) {
        return member.user;
      }
    })
    .filter((m) => m);

  if (_.isEmpty(playingUsers)) {
    throw new Error("No Playing Members");
  }

  return playingUsers;
}

module.exports = { getPlayingUsers, roleNames };
