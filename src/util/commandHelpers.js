const { organizeRoles } = require("./rolesHelpers");
require("dotenv").config();

const commandNames = {
  CREATE_GAME: "play",
  GIF: "gif",
  INFO: "info",
  PING: "ping",
  PLAYING: "playing",
  REMOVE_GAME: "end",
  STOP_PLAYING: "stop_playing",
  VOTE: "vote",
  SERVER_SETUP: "server_setup",
};

async function gameCommandPermissions(interaction, users) {}

// run permissions for playing commands when server launches
// run permissions for game commands for user ids.
async function setupCommandPermissions(interaction) {
  const commands = await interaction.guild.commands.fetch();
  const roles = await interaction.guild.roles.fetch();
  const organizedRoles = organizeRoles(roles);
  const organizedCommands = organizeCommands(commands);

  denyPlayingPermissions = [
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

  allowPlayingPermissions = [
    {
      id: organizedRoles.alive.id,
      type: "ROLE",
      permission: true,
    },
    {
      id: interaction.guild.id,
      type: "ROLE",
      permission: false,
    },
  ];

  adminPermissions = {
    id: organizedRoles.admin.id,
    type: "ROLE",
    permission: true,
  };

  ownersPermissions = [
    {
      id: interaction.guild.id,
      type: "ROLE",
      permission: false,
    },
    {
      id: interaction.guild.ownerId,
      type: "USER",
      permission: true,
    },
  ];

  const fullPermissions = [
    {
      id: organizedCommands.playing.id,
      permissions: denyPlayingPermissions,
    },
    {
      id: organizedCommands.stopPlaying.id,
      permissions: denyPlayingPermissions,
    },
    {
      id: organizedCommands.removeGame.id,
      permissions: [...ownersPermissions, adminPermissions],
    },
    {
      id: organizedCommands.serverSetup.id,
      permissions: ownersPermissions,
    },
    {
      id: organizedCommands.createGame.id,
      permissions: [...ownersPermissions, adminPermissions],
    },
    {
      id: organizedCommands.vote.id,
      permissions: allowPlayingPermissions,
    },
  ];

  await interaction.guild.commands.permissions.set({ fullPermissions });
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
      case commandNames.SERVER_SETUP:
        commandObject.serverSetup = command;
        break;
      case commandNames.REMOVE_GAME:
        commandObject.removeGame = command;
        break;
      case commandNames.CREATE_GAME:
        commandObject.createGame = command;
        break;
      case commandNames.VOTE:
        commandObject.vote = command;
        break;
    }
  });
  return commandObject;
}

module.exports = {
  setupCommandPermissions,
  gameCommandPermissions,
  commandNames,
};
