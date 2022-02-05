const { organizeRoles } = require("./rolesHelpers");
require("dotenv").config();
const { updateUser } = require("../werewolf_db");

/* 
To add a new game command add it to the
  1. commandNames
  2. removeUsersPermissions
  3. gameCommandPermissions
  4. organizeGameCommands
*/
const commandNames = {
  // Fun Commands
  GIF: "gif",
  INFO: "info",
  PING: "ping",
  // Admin commands
  SERVER_SETUP: "server_setup",
  CREATE_GAME: "play",
  REMOVE_GAME: "end",
  RESET_SCHEDULING: "reset_scheduling",
  // Player game commands
  PLAYING: "playing",
  STOP_PLAYING: "stop_playing",
  WHO_IS_ALIVE: "who_is_alive",
  SHOW_VOTES: "show_votes",
  VOTE: "vote",
  KILL: "kill",
  SEE: "see",
  GUARD: "guard",
};

/* 
To add a new character add it to these
  1. characters list below
  2. removeUsersPermissions
  3. resetNightPowers
  4. gameCommandPermissions
  5. add a channel for character?
gameHelpers
  1. add character to leftOverRoles
  2. add characters powers in the newCharacter switch statement
  3. add permissions for character in createChannels

making a channel for character
 1. removeAllGameChannels
 2. createChannel in gameHelpers
 3. add the channel to the channelHelpers
*/

// TODO: make these characters and add them to giveUserRole in gameHelpers
const characters = {
  WEREWOLF: "werewolf",
  VILLAGER: "villager",
  SEER: "seer",
  BODYGUARD: "bodyguard",
  // APPRENTICE_SEER: "apprentice seer",
  // FOOL: "fool",
  // PRIEST: "priest",
  LYCAN: "lycan", // can't be played currently
  // TRAITOR: "traitor",
  // MASON: "mason",
  // HUNTER: "hunter",
};

const voteText =
  "Every day you may vote to hang someone by using the `/vote` command in the town square.";

async function sendGreeting(member, user) {
  if (member.user.bot) {
    return;
  }
  switch (user.character) {
    case characters.VILLAGER:
      await member.send(
        `You are a **Villager!** Your job is to find out who is a werewolf and hang them for their crimes. ${voteText} Be careful at night, the werewolves are hungry`
      );
      break;
    case characters.WEREWOLF:
      await member.send(
        `You are a **Werewolf!** Don't let the villagers know or they will hang you! It is not your fault they are so tasty. ${voteText} At night use the \`/kill\` command to target a villager to be killed. You can change your target by using the same command. The werewolf team can only target one villager per night.`
      );
      break;
    case characters.SEER:
      await member.send(
        `You are a **Seer!** You have been chosen by the spirits to help the villagers get rid of the werewolves. ${voteText} At night use the \`/see\` command to see if a player's character is a werewolf or a villager.`
      );
      break;
    case characters.BODYGUARD:
      await member.send(
        `You are a **Bodyguard!** Your job is to guard the village from the werewolves. ${voteText} At night use the \`guard\` command to guard a player from the werewolves. If the werewolves choose the player you guarded then no one will die that night. You may guard yourself but you can't guard someone twice in a row.`
      );
      break;
  }
}

async function resetNightPowers(users, guildId) {
  await Promise.all(
    users.map(async (user) => {
      switch (user.character) {
        case characters.SEER:
          await updateUser(user.id, guildId, { see: true });
          break;
        case characters.BODYGUARD:
          await updateUser(user.id, guildId, { guard: true });
          break;
      }
    })
  );
}

async function removeUsersPermissions(interaction, user) {
  const commands = await interaction.guild.commands.fetch();
  const organizedCommands = organizeGameCommands(commands);
  let command;
  switch (user.character) {
    case characters.VILLAGER:
      break;
    case characters.WEREWOLF:
      command = organizedCommands.kill;
      break;
    case characters.SEER:
      command = organizedCommands.see;
      break;
    case characters.BODYGUARD:
      command = organizedCommands.guard;
      break;
  }
  if (command) {
    await interaction.guild.commands.permissions.add({
      command: command.id,
      permissions: [
        {
          id: user.user_id,
          type: "USER",
          permission: false,
        },
      ],
    });
  }
}

async function gameCommandPermissions(interaction, users, permission) {
  const commands = await interaction.guild.commands.fetch();
  const organizedCommands = organizeGameCommands(commands);

  users.forEach((user) => {
    permissions = [
      {
        id: user.user_id || user.id,
        type: "USER",
        permission,
      },
    ];
    switch (user.character) {
      case characters.VILLAGER:
        break;
      case characters.WEREWOLF:
        interaction.guild.commands.permissions.add({
          command: organizedCommands.kill.id,
          permissions,
        });
        break;
      case characters.SEER:
        interaction.guild.commands.permissions.add({
          command: organizedCommands.see.id,
          permissions,
        });
        break;
      case characters.BODYGUARD:
        interaction.guild.commands.permissions.add({
          command: organizedCommands.guard.id,
          permissions,
        });
        break;
    }
  });
}

// run permissions for playing commands when server launches
// run permissions for game commands for user ids.
async function setupCommandPermissions(interaction) {
  const commands = await interaction.guild.commands.fetch();
  const roles = await interaction.guild.roles.fetch();
  const organizedRoles = organizeRoles(roles);
  const organizedCommands = organizeSetupCommands(commands);

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
    {
      id: organizedCommands.resetScheduling.id,
      permissions: [...ownersPermissions, adminPermissions],
    },
    {
      id: organizedCommands.showVotes.id,
      permissions: allowPlayingPermissions,
    },
  ];

  await interaction.guild.commands.permissions.set({ fullPermissions });
}

function organizeSetupCommands(commands) {
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
      case commandNames.RESET_SCHEDULING:
        commandObject.resetScheduling = command;
      case commandNames.SHOW_VOTES:
        commandObject.showVotes = command;
    }
  });
  return commandObject;
}

function organizeGameCommands(commands) {
  const commandObject = {};
  commands.forEach((command) => {
    switch (command.name) {
      case commandNames.KILL:
        commandObject.kill = command;
        break;
      case commandNames.SEE:
        commandObject.see = command;
        break;
      case commandNames.GUARD:
        commandObject.guard = command;
        break;
    }
  });
  return commandObject;
}

module.exports = {
  setupCommandPermissions,
  gameCommandPermissions,
  removeUsersPermissions,
  organizeGameCommands,
  resetNightPowers,
  sendGreeting,
  commandNames,
  characters,
};
