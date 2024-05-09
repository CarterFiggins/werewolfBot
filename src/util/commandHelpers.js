require("dotenv").config();
const _ = require("lodash");
const { updateUser, findAllUsers } = require("../werewolf_db");

/* 
To add a new game command add it to the
  1. commandNames
  2. add new file for command
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
  SETTINGS: "settings",
  // Player game commands
  PLAYING: "playing",
  STOP_PLAYING: "stop_playing",
  WHO_IS_ALIVE: "who_is_alive",
  SHOW_VOTES: "votes",
  SHOW_VOTERS_FOR: "voters_for",
  VOTE: "vote",
  KILL: "kill",
  SEE: "see",
  GUARD: "guard",
  SHOOT: "shoot",
  WHISPER: "whisper",
  PERMISSION_RESET: "permission_reset",
  CURSE: "curse",
  VAMPIRE_BITE: "vampire_bite",
  COPY: "copy",
  MUTE: "mute",
  RANDOM_VOTE: "random_vote",
};

/* 
To add a new character add it to these
  1. characters list below
  2. resetNightPowers
  3. add a channel for character?
gameHelpers
  1. add character to leftOverRoles
  2. add characters powers in the newCharacter switch statement
  3. add permissions for character in createChannels
Computing characters
  1. add max character amount

making a channel for character
 1. removeAllGameChannels
 2. createChannel in gameHelpers
 3. add the channel to the channelHelpers
*/

const characters = {
  //helps villagers
  VILLAGER: "villager",
  SEER: "seer",
  BODYGUARD: "bodyguard",
  APPRENTICE_SEER: "apprentice seer",
  MASON: "mason",
  HUNTER: "hunter",
  GROUCHY_GRANNY: "grouchy granny",
  DOPPELGANGER: "doppelganger",
  // helps werewolves
  WEREWOLF: "werewolf",
  FOOL: "fool",
  LYCAN: "lycan",
  BAKER: "baker",
  MUTATED: "mutated villager",
  CUB: "werewolf cub",
  WITCH: "witch",
  VAMPIRE: "king",
};

const voteText =
  "Every day you may vote to hang someone by using the `/vote` command in the town square.";

async function sendGreeting(member, user) {
  try {
    if (member.user.bot) {
      return;
    }

    const villagerMessage = `You are a **Villager!**\nYour job is to find out who is a werewolf and hang them for their crimes.\n${voteText}\nBe careful at night, the werewolves are hungry\n`;
    const bakerMessage = `You are the **Baker**.\nYou make all the bread for the village.\n${voteText}\nIf you die then the villagers will start to die from starvation one by one every day.\nWith the knowledge to make bread comes great responsibility.`;
    const hunterMessage = `You are the **Hunter**.\n${voteText}\nWhen you die you will be able to shoot one player using the \`/shoot\` command in town-square.\nTry and hit a werewolf to help out the villagers.`;

    switch (user.character) {
      case characters.MUTATED:
        await member.send(
          _.sample([villagerMessage, bakerMessage, hunterMessage])
        );
        break;
      case characters.LYCAN:
      case characters.VILLAGER:
        await member.send(villagerMessage);
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
      case characters.APPRENTICE_SEER:
        await member.send(
          `You are the **Apprentice Seer**.\n${voteText}\nYou start as a regular villager but, if the seer dies you become the new seer and pick up where they left off.\nWhen that day comes use the \`/see\` command at night to see if a player's character is a werewolf or a villager.\n`
        );
        break;
      case characters.BAKER:
        await member.send(bakerMessage);
        break;
      case characters.HUNTER:
        await member.send(hunterMessage);
        break;
      case characters.WITCH:
        await member.send(
          `You are a **Witch**.\n${voteText}\nYou are on the werewolf team but you don't know which players are the werewolves.\nYou can curse a player in the game with the \`/curse\` command.\nWhen you are hanged by the villagers the players that are cursed will die.\nWerewolves are not effected by the curse\nIf the werewolves kill you your curse does nothing.`
        );
        break;
      case characters.VAMPIRE:
        await member.send(
          `You are a **Vampire King**\n${voteText}\nVampires are on there own team. Bite other players to turn them into a vampire by using the command \`/vampire_bite\`\nIf you try to bite a werewolf you die.\nIf you bite someone the same night as the werewolf kill that victim you will also die.\nYou have to bite the victim **2 times** before they turn into a vampire.`
        );
        break;
      case characters.DOPPELGANGER:
        await member.send(
          `You are a **Doppelganger**\n${voteText}\nYou don't know what team you are on yet. Use the \`/copy\` command to copy another players character. If that player has a chat you will join them. If you do not choose by the next day the bot will choose for you.`
        );
        break;
      case characters.GROUCHY_GRANNY:
        await member.send(
          `You are a **Grouchy Granny**\n${voteText}\nYou can mute someone out of town square using the \`/mute\` command for the rest of the day and night. They will come back tomorrow but while they are gone they will be able to leave messages in the out cast channel. This will not allow them to use their night power. You will not be able to mute the same player for the rest of the game`
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
      }
    })
  );
}

async function resetDayPowers(guildId) {
  const cursor = await findAllUsers(guildId);
  const users = await cursor.toArray();
  await Promise.all(
    users.map(async (user) => {
      switch (user.character) {
        case characters.GROUCHY_GRANNY:
          await updateUser(user.user_id, guildId, { hasMuted: false });
          break;
      }
    })
  );
}

module.exports = {
  resetNightPowers,
  resetDayPowers,
  sendGreeting,
  commandNames,
  characters,
};
