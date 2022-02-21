const { organizeRoles } = require("./rolesHelpers");
require("dotenv").config();
const { updateUser, findAllUsers } = require("../werewolf_db");

/* 
To add a new game command add it to the
  1. commandNames
  2. removeUsersPermissions
  3. gameCommandPermissions
  4. organizeGameCommands
  5. add new file for command
*/
const commandNames = {
  // Fun Commands
  GIF: "gif",
  INFO: "info",
  PING: "ping",
  // Admin commands
  SERVER_SETUP: "server_setup",
  CREATE_GAME: "start_game",
  REMOVE_GAME: "end",
  RESET_SCHEDULING: "reset_scheduling",
  DAY_TIME: "day_time",
  NIGHT_TIME: "night_time",
  // Player game commands
  PLAYING: "playing",
  STOP_PLAYING: "stop_playing",
  WHO_IS_ALIVE: "who_is_alive",
  SHOW_VOTES: "show_votes",
  VOTE: "vote",
  KILL: "kill",
  SEE: "see",
  GUARD: "guard",
  SHOOT: "shoot",
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

const characters = {
  WEREWOLF: "werewolf",
  VILLAGER: "villager",
  SEER: "seer",
  BODYGUARD: "bodyguard",
  APPRENTICE_SEER: "apprentice seer",
  LYCAN: "lycan",
  MASON: "mason",
  FOOL: "fool",
  HUNTER: "hunter",
  BAKER: "baker",
  // PRIEST: "priest",
  // TRAITOR: "traitor",
};

const voteText =
  "Every day you may vote to hang someone by using the `/vote` command in the town square.";

async function sendGreeting(member, user) {
  try {
    if (member.user.bot) {
      return;
    }

    switch (user.character) {
      case characters.VILLAGER:
        await member.send(
          `You are a **Villager!**\nYour job is to find out who is a werewolf and hang them for their crimes.\n${voteText}\nBe careful at night, the werewolves are hungry\n`
        );
        break;
      case characters.WEREWOLF:
        await member.send(
          `You are a **Werewolf!**\nDon't let the villagers know or they will hang you! It is not your fault they are so tasty.\n${voteText}\nAt night use the \`/kill\` command to target a villager to be killed.\nYou can change your target by using the same command.\nThe werewolf team can only target one villager per night.\n`
        );
        break;
      case characters.SEER:
      case characters.FOOL:
        await member.send(
          `You are a **Seer!**\nYou have been chosen by the spirits to help the villagers get rid of the werewolves.\n${voteText}\nAt night use the \`/see\` command to see if a player's character is a werewolf or a villager.\n If there are two of you here one is the fool.`
        );
        break;
      case characters.BODYGUARD:
        await member.send(
          `You are a **Bodyguard!**\nYour job is to guard the village from the werewolves.\n${voteText}\nAt night use the \`guard\` command to guard a player from the werewolves.\nIf the werewolves choose the player you guarded than no one will die that night.\nYou may guard yourself but you can't guard someone twice in a row.\n`
        );
        break;
      case characters.MASON:
        await member.send(
          `You are a **Mason**.\nYou belong to a super secret group.\nEveryone in the mason group is to be trusted and is not a werewolf.\n${voteText}\nIf the bodyguard protects one of the masons they get to join your super cool group.\n`
        );
        break;
      case characters.LYCAN:
        await member.send(
          `You are a **Lycan**.\nYou are a villager but you have the very rare lycan gene that confuses the spirits.\n${voteText}\nBecause of your cursed gene, if a seer investigates your character the spirits will tell them you are a werewolf when you really are a villager.\n`
        );
        break;
      case characters.APPRENTICE_SEER:
        await member.send(
          `You are the **Apprentice Seer**.\n${voteText}\nYou start as a regular villager but, if the seer dies you become the new seer and pick up where they left off.\nWhen that day comes use the \`/see\` command at night to see if a player's character is a werewolf or a villager.\n`
        );
        break;
      case characters.BAKER:
        await member.send(
          `You are the **Baker**.\nYou make all the bread for the village.\n${voteText}\nIf you die then the villagers will start to die from starvation one by one every day.\nWith the knowledge to make bread comes great responsibility.`
        );
      case characters.HUNTER:
        await member.send(
          `You are the **Hunter**.\n${voteText}\nWhen you die you will be able to shoot one player using the \`/shoot\` command in town-square.\nTry and hit a werewolf to help out the villagers.`
        );
    }
  } catch (error) {
    console.log(error);
    console.log(member);
    console.log(user);
  }
}

async function resetNightPowers(guildId) {
  const cursor = await findAllUsers(guildId);
  const users = await cursor.toArray();
  await Promise.all(
    users.map(async (user) => {
      switch (user.character) {
        case characters.SEER:
        case characters.FOOL:
          await updateUser(user.user_id, guildId, { see: true });
          break;
        case characters.BODYGUARD:
          await updateUser(user.user_id, guildId, { guard: true });
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
    case characters.APPRENTICE_SEER:
    case characters.FOOL:
      command = organizedCommands.see;
      break;
    case characters.HUNTER:
      command = organizedCommands.shoot;
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

  // TODO: refactor this into one loop
  const werewolves = users.filter(
    (user) => user.character === characters.WEREWOLF
  );
  const seers = users.filter(
    (user) =>
      user.character === characters.SEER || user.character === characters.FOOL
  );
  const bodyguards = users.filter(
    (user) => user.character === characters.BODYGUARD
  );
  const hunters = users.filter((user) => user.character === characters.HUNTER);

  const werewolvesPermissions = werewolves.map((user) => ({
    id: user.user_id || user.id,
    type: "USER",
    permission,
  }));
  const seersPermissions = seers.map((user) => ({
    id: user.user_id || user.id,
    type: "USER",
    permission,
  }));
  const bodyguardsPermissions = bodyguards.map((user) => ({
    id: user.user_id || user.id,
    type: "USER",
    permission,
  }));
  const hunterPermissions = hunters.map((user) => ({
    id: user.user_id || user.id,
    type: "USER",
    permission,
  }));

  await interaction.guild.commands.permissions.add({
    command: organizedCommands.kill.id,
    permissions: werewolvesPermissions,
  });
  await interaction.guild.commands.permissions.add({
    command: organizedCommands.see.id,
    permissions: seersPermissions,
  });
  await interaction.guild.commands.permissions.add({
    command: organizedCommands.guard.id,
    permissions: bodyguardsPermissions,
  });
  await interaction.guild.commands.permissions.add({
    command: organizedCommands.shoot.id,
    permissions: hunterPermissions,
  });
}

async function addApprenticeSeePermissions(interaction, user) {
  const commands = await interaction.guild.commands.fetch();
  const organizedCommands = organizeGameCommands(commands);
  permissions = [
    {
      id: user.user_id || user.id,
      type: "USER",
      permission: true,
    },
  ];
  interaction.guild.commands.permissions.add({
    command: organizedCommands.see.id,
    permissions,
  });
}

// run permissions for playing commands when server launches
// run permissions for game commands for user ids.
async function setupCommandPermissions(interaction) {
  const commands = await interaction.guild.commands.fetch();
  const roles = await interaction.guild.roles.fetch();
  const organizedRoles = organizeRoles(roles);
  const organizedCommands = organizeSetupCommands(commands);

  const denyPlayingPermissions = [
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

  const allowPlayingPermissions = [
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

  const adminPermissions = {
    id: organizedRoles.admin.id,
    type: "ROLE",
    permission: true,
  };

  const ownersPermissions = [
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

  const ownerAndAdmin = [...ownersPermissions, adminPermissions];

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
      permissions: ownerAndAdmin,
    },
    {
      id: organizedCommands.serverSetup.id,
      permissions: ownersPermissions,
    },
    {
      id: organizedCommands.createGame.id,
      permissions: ownerAndAdmin,
    },
    {
      id: organizedCommands.vote.id,
      permissions: allowPlayingPermissions,
    },
    {
      id: organizedCommands.resetScheduling.id,
      permissions: ownerAndAdmin,
    },
    {
      id: organizedCommands.showVotes.id,
      permissions: allowPlayingPermissions,
    },
    {
      id: organizedCommands.dayTime.id,
      permissions: ownerAndAdmin,
    },
    {
      id: organizedCommands.nightTime.id,
      permissions: ownerAndAdmin,
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
        break;
      case commandNames.SHOW_VOTES:
        commandObject.showVotes = command;
        break;
      case commandNames.DAY_TIME:
        commandObject.dayTime = command;
        break;
      case commandNames.NIGHT_TIME:
        commandObject.nightTime = command;
        break;
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
      case commandNames.SHOOT:
        commandObject.shoot = command;
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
  addApprenticeSeePermissions,
  commandNames,
  characters,
};
