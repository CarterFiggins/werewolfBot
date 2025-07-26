const _ = require("lodash");
const { findSettings, updateGame } = require("../../werewolf_db");
const { organizeChannels } = require("../channelHelpers");
const { characters } = require("../commandHelpers");
const { castWitchCurse } = require("../deathHelper");
const { PowerUpNames } = require("../powerUpHelpers");

async function votingDeathMessage({ interaction, playersDeathInfo }) {
  const settings = await findSettings(interaction.guild.id);
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);

  if (_.isEmpty(playersDeathInfo)) {
    await organizedChannels.townSquare.send("## No one has voted...\n# **It is night time**");
    return;
  }

  const [playersKilledData, randomPlayersKilled] = _.partition(playersDeathInfo, ['random', false])

  let message = ""
  if (!_.isEmpty(playersKilledData)) {
    const playersKilled = _.map(playersKilledData, (playerData) => playerData.member).join(", ")
    message = `The town has decided to hang ${playersKilled}\n`;
  }

  if (!_.isEmpty(playersKilledData) && !_.isEmpty(randomPlayersKilled)) {
    message += "For the next hanging...\n"
  }

  if (!_.isEmpty(randomPlayersKilled)) {
    const playersKilled = _.map(randomPlayersKilled, (playerData) => playerData.member).join(", ")
    message +=`There was a tie so I randomly picked ${playersKilled} to die\n`
  }

  if (message) {
    await organizedChannels.townSquare.send(
      `## ${message}`
    );
  }

  for (const playerInfo of playersDeathInfo) {
    const {
      member: deadMember,
      user: deadUser,
      deathCharacter,
    } = playerInfo
    let cursedMessage = "";
    let deathMessage = settings.hard_mode ? '' : `## The town has killed a **${deathCharacter}**\n`;

    if (deathCharacter === PowerUpNames.SHIELD) {
      deathMessage = `## 🛡️However, ${deadMember} had a protective shield, sparing them from this fate! The shield is now used up and will not offer protection again.🛡️`
    } else if (deadUser.character === characters.WITCH) {
      cursedMessage = await castWitchCurse(interaction);
    } else if (deadUser.character === characters.HUNTER) {
      deathMessage = `## The town has injured the **${deathCharacter}**\n${deadMember} you don't have long to live. Grab your gun and \`/shoot\` someone.\n`;
    }
  
    await updateGame(interaction.guild.id, {
      is_day: false,
    });
  
    if (deathMessage || cursedMessage) {
      await organizedChannels.townSquare.send(
        `${deathMessage}${cursedMessage}`
      );
    }
  }

  await organizedChannels.townSquare.send(
    `# **It is night time**`
  );
}

async function vampireDeathMessage({ werewolfAttacked, victim, deadCharacter, vampireMember }) {
  if (deadCharacter === PowerUpNames.SHIELD) {
    return null
  }
  if (werewolfAttacked) {
    if (victim.character === characters.MUTATED) {
      return `The ${deadCharacter} named ${vampireMember} died while in the way of the werewolves\nhttps://tenor.com/5qDD.gif\n`;
    }
    return `The ${deadCharacter} named ${vampireMember} died while in the way of the werewolves\nhttps://tenor.com/5qDD.gif\n`;
  } else {
    return `The ${deadCharacter} named ${vampireMember} tried to suck blood from a werewolf and died\nhttps://tenor.com/sJlV.gif\n`;
  }
} 

async function starveDeathMessage({ starvedCharacter, starvedMember, starvedUser }) {
  if (starvedCharacter === PowerUpNames.SHIELD) {
    return `🛡️A villager was about to starve! But surprise the villager's shield turned into a sandwich and saved the day! The shield (now a tasty snack) is gone.🥪`
  }

  let deadMessage = "has died from starvation";

  if (starvedUser.character === characters.HUNTER) {
    deadMessage =
      "is really hungry and about to die. Quick shoot someone with the `/shoot` command";
  }

  return `The **${starvedCharacter}** named ${starvedMember} ${deadMessage}\n`;
}

module.exports = {
  votingDeathMessage,
  vampireDeathMessage,
  starveDeathMessage,
}