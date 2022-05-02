const roleNames = {
  PLAYING: "Playing",
  ALIVE: "Alive",
  DEAD: "Dead",
  ADMIN: "Admin",
};

function isAdmin(member) {
  const mapRoles = member.roles.cache;
  const roles = mapRoles.map((role) => {
    return role.name;
  });
  console.log(roles);
  console.log(roles.includes(roleNames.ADMIN));
  return roles.includes(roleNames.ADMIN);
}

function isAlive(member) {
  const mapRoles = member.roles.cache;
  const roles = mapRoles.map((role) => {
    return role.name;
  });
  return roles.includes(roleNames.ALIVE);
}

function isPlaying(member) {
  const mapRoles = member.roles.cache;
  const roles = mapRoles.map((role) => {
    return role.name;
  });
  return roles.includes(roleNames.PLAYING);
}

function isDead(member) {
  const mapRoles = member.roles.cache;
  const roles = mapRoles.map((role) => {
    return role.name;
  });
  return roles.includes(roleNames.DEAD);
}

async function setupRoles(interaction) {
  const roles = await interaction.guild.roles.fetch();
  const allRoles = organizeRoles(roles);

  //it would be nice if we could cache the roles id in the db

  if (!allRoles.playing) {
    await interaction.guild.roles.create({
      name: roleNames.PLAYING,
      color: "DARK_GOLD",
      reason: "For players to be marked as ready",
    });
  }
  if (!allRoles.alive) {
    await interaction.guild.roles.create({
      name: roleNames.ALIVE,
      color: "DARK_GREEN",
      reason: "For players that are alive in the game",
    });
  }
  if (!allRoles.dead) {
    await interaction.guild.roles.create({
      name: roleNames.DEAD,
      color: "DARK_RED",
      reason: "For players that are dead in the game",
    });
  }
  if (!allRoles.admin) {
    await interaction.guild.roles.create({
      name: roleNames.ADMIN,
      color: "DARK_BLUE",
      reason: "admins can start games",
    });
  }
}

async function removeGameRolesFromMembers(members, roles) {
  const organizedRoles = organizeRoles(roles);
  await Promise.all(
    members.map(async (member) => {
      await member.roles.remove(organizedRoles.dead);
      await member.roles.remove(organizedRoles.alive);
    })
  );
}

async function getRole(interaction, roleName) {
  const roles = await interaction.guild.roles.fetch();

  let foundRole = null;

  roles.forEach((role) => {
    if (role.name === roleName) {
      foundRole = role;
    }
  });
  return foundRole;
}

function organizeRoles(roles) {
  const rolesObject = {};
  roles.forEach((role) => {
    switch (role.name) {
      case roleNames.ALIVE:
        rolesObject.alive = role;
        break;
      case roleNames.DEAD:
        rolesObject.dead = role;
        break;
      case roleNames.PLAYING:
        rolesObject.playing = role;
        break;
      case roleNames.ADMIN:
        rolesObject.admin = role;
        break;
    }
  });
  return rolesObject;
}

module.exports = {
  setupRoles,
  organizeRoles,
  removeGameRolesFromMembers,
  roleNames,
  getRole,
  isAdmin,
  isAlive,
  isPlaying,
  isDead,
};
