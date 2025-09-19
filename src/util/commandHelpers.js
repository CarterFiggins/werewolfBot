require("dotenv").config();
const _ = require("lodash");
const { findSettings } = require("../werewolf_db");
const { characters } = require("./characterHelpers/characterUtil");
const { PowerUpNames } = require("./powerUpHelpers");

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
  FORCE_PLAYING: "force_playing",
  CREATE_GAME: "start_game",
  REMOVE_GAME: "end",
  RESET_SCHEDULING: "reset_scheduling",
  DAY_TIME: "day_time",
  NIGHT_TIME: "night_time",
  SETTINGS: "settings",
  ANNOUNCE_NEW_GAME: "announce_new_game",
  // Player game commands
  PLAYING: "playing",
  JOIN_THE_DEAD: "join_the_dead",
  STOP_PLAYING: "stop_playing",
  WHO_IS_ALIVE: "who_is_alive",
  WHO_AM_I: "who_am_i",
  SHOW_VOTES: "votes",
  SHOW_VOTERS_FOR: "voters_for",
  VOTE: "vote",
  KILL: "kill",
  INVESTIGATE: "investigate",
  GUARD: "guard",
  SHOOT: "shoot",
  WHISPER: "whisper",
  PERMISSION_RESET: "permission_reset",
  CURSE: "curse",
  VAMPIRE_BITE: "vampire_bite",
  COPY: "copy",
  MUTE: "mute",
  CHAOS_TARGET: "chaos_target",
  RANDOM_VOTE: "random_vote",
  BESTOW_POWER: "bestow_power",
  CUPIDS_ARROWS: "cupids_arrows",
  // power up commands
  ALLIANCE_DETECTOR: "alliance_detector",
  PREDATOR_VISION: "predator_vision",
  STUN: "stun",
  STEAL: "steal",
};

const voteText =
  "Every day you may vote to hang someone by using the `/vote` command in the town square.";

const powerUpMessages = new Map([
  [
    PowerUpNames.GUN,
    "You have a gun with one bullet. You can use the `/shoot` command once this game at any time. People will know it was you who fired the gun.",
  ],
  [
    PowerUpNames.SHIELD,
    "You have a shield. It will protect you once from death. The shield will not protect from a vampire bite.",
  ],
  [
    PowerUpNames.ALLIANCE_DETECTOR,
    "You have an Alliance Detector! Use `/alliance_detector` to check two players. It will tell you if they are on the same team or not.",
  ],
  [
    PowerUpNames.PREDATOR_VISION,
    "You have Predator vision witch allows you to look at a player and find their true character. Use command `/predator_vision` to see the players true role.",
  ],
  [
    PowerUpNames.STEAL,
    "You can steal a power up from another player. Use command `/steal` to steal.",
  ],
  [
    PowerUpNames.STUN,
    "You can stun a player removing their ability to vote or night ability. Use command `/stun` to stun a player",
  ],
]);

function showAllPowerUpMessages() {
  return _.join(
    _.map(Array.from(powerUpMessages.entries()), ([name, message]) => {
      return `* **${name}**: ${message}`;
    }),
    "\n"
  );
}

async function sendGreeting(interaction, user) {
  try {
    const member = await interaction.guild.members.fetch(user.id);
    const settings = await findSettings(interaction.guild.id);
    if (member.user.bot) {
      return;
    }

    const villagerMessage = `You are a **Villager!**\nYour job is to find out who is a werewolf and hang them for their crimes.\n${voteText}\nBe careful at night, the werewolves are hungry\n`;
    const bakerMessage = `You are the **Baker**.\nYou make all the bread for the village.\n${voteText}\nIf you die then the villagers will start to die from starvation one by one every day.\nWith the knowledge to make bread comes great responsibility.`;
    const hunterMessage = `You are the **Hunter**.\n${voteText}\nWhen you die you will be able to shoot one player using the \`/shoot\` command in town-square.\nTry and hit a werewolf to help out the villagers.`;

    switch (user.info.assigned_identity) {
      case characters.VILLAGER:
        await member.send(villagerMessage);
        break;
      case characters.WEREWOLF:
        await member.send(
          `You are a **Werewolf!**\nDon't let the villagers know or they will hang you! It is not your fault they are so tasty.\n${voteText}\nAt night use the \`/kill\` command to target a villager to be killed.\nYou can change your target by using the same command.\nThe werewolf team can only target one villager per night.\n`
        );
        break;
      case characters.SEER:
        await member.send(
          `You are a **Seer!**\nYou have been chosen by the spirits to help the villagers get rid of the werewolves.\n${voteText}\nAt night use the \`/investigate\` command to see if a player's character is a werewolf or a villager.\n Remember you have a chance of being a fool.`
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
          `You are the **Apprentice Seer**.\n${voteText}\nYou start as a regular villager but, if the seer dies you become the new seer and pick up where they left off.\nWhen that day comes use the \`/investigate\` command at night to see if a player's character is a werewolf or a villager.\n`
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
        break;
      case characters.CHAOS_DEMON:
        await member.send(
          `You are a **Chaos Demon**\n${voteText}\nYou are on your own team. On the first night target a player using \`/chaos_target\`.\nTo win the game you must get the player that was targeted hanged. If that player dies in a different way you will die.`
        );
        break;
      case characters.MONARCH:
        await member.send(
          `You are a **Monarch**\n${voteText}\nYou can \`/bestow_power\` to a player, but each power can only be given once, and not to the same player twice. Choose wisely who gets them. Help the villagers win!\nHere are all the powers you can give the the message that will be sent to the player who gets them.\n${showAllPowerUpMessages()}`
        );
        break;
      case characters.CUPID:
        await member.send(
          `You are **Cupid**\n${voteText}\nOn the first night use \`/cupids_arrows\` to pick two users that will fall in love and be on the same team. Cupid will not be able to whisper to the couple (They think it's true love don't ruin it!) If one of them dies the other will die from a broken heart. As Cupid you will win with the cupid couple. Help them survive to the end. Cupid counts as a villager.`
        )
    }

    if (settings.enable_power_ups) {
      for (const powerKey in user.info.power_ups) {
        if (user.info.power_ups[powerKey]) {
          member.send(`POWER UP! ${powerUpMessages.get(powerKey)}`);
        }
      }
    }
  } catch (error) {
    console.error(error);
    console.log(user);
  }
}

module.exports = {
  sendGreeting,
  powerUpMessages,
  commandNames,
  characters,
  showAllPowerUpMessages,
};
