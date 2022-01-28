// const { roleNames } = require("./gameHelpers");
require("dotenv").config();

const roleNames = {
  PLAYING: "Playing",
  ALIVE: "Alive",
  DEAD: "Dead",
};

const commandNames = {
  CREATE_GAME: "play",
  GIF: "gif",
  INFO: "info",
  PING: "ping",
  PLAYING: "playing",
  REMOVE_GAME: "end",
  STOP_PLAYING: "stop_playing",
  VOTE: "vote",
};

// run permissions for playing commands when server launches
// run permissions for game commands for user ids.
async function commandPermissions(interaction, users) {
  const commands = await interaction.guild.commands.fetch();
  const roles = await interaction.guild.roles.fetch();
  const organizedRoles = organizeRoles(roles);
  const organizedCommands = organizeCommands(commands);

  playingPermissions = [
    {
      id: organizedRoles.alive.id,
      type: "ROLE",
      permission: false,
    },
    {
      id: organizedRoles.dead.id,
      type: "ROLE",
      permission: false,
    },
  ];

  // console.log(playing.permissions);
  await organizedCommands.playing.permissions.add({
    permissions: playingPermissions,
  });
  await organizedCommands.stopPlaying.permissions.add({
    permissions: playingPermissions,
  });
}

// TODO add to db so we don't have to do this
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
    }
  });
  return rolesObject;
}

// TODO add to db so we don't have to do this
function organizeCommands(commands) {
  const commandObject = {};
  commands.forEach((command) => {
    switch (command.name) {
      case commandNames.PLAYING:
        commandObject.playing = command;
        break;
      case commandNames.STOP_PLAYING:
        commandObject.stopPlaying = command;
        break;
    }
  });
  return commandObject;
}

module.exports = {
  commandPermissions,
  commandNames,
};
