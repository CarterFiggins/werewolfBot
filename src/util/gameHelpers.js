const _ = require("lodash");
const { createGame } = require("../werewolf_db");
const {
  sendStartMessages,
  channelNames,
  createChannels,
} = require("./channelHelpers");
const { timeScheduling } = require("./timeHelper");
const computeCharacters = require("./computeCharacters");
const { sendGreeting, characters } = require("./commandHelpers");
const { getRole, roleNames } = require("./rolesHelpers");
const { crateUserData } = require("./userHelpers");

async function startGame(interaction) {
  const playingDiscordUsers = await getPlayingDiscordUsers(interaction);
  if (!playingDiscordUsers) {
    return;
  }
  const discordUsers = await giveUserRoles(interaction, playingDiscordUsers);

  await sendUsersMessage(interaction, discordUsers);
  await createChannels(interaction, discordUsers);
  // give users character command permissions
  await createGameDocument(interaction);
  await timeScheduling(interaction);
  await sendStartMessages(interaction, discordUsers);

  // successfully created game
  return true;
}

async function sendUsersMessage(interaction, discordUsers) {
  await Promise.all(
    discordUsers.map(async (user) => {
      sendGreeting(interaction, user);
    })
  );
}

async function createGameDocument(interaction) {
  await createGame({
    guild_id: interaction.guild.id,
    is_day: false,
    first_night: true,
    is_baker_dead: false,
    wolf_double_kill: false,
  });
}

async function getPlayingDiscordUsers(interaction) {
  let playingRole = await getRole(interaction, roleNames.PLAYING);

  if (!playingRole) {
    throw new Error("No playing role created");
  }

  const members = await interaction.guild.members.fetch();
  const playingDiscordUsers = members
    .map((member) => {
      if (member._roles.includes(playingRole.id)) {
        return member.user;
      }
    })
    .filter((m) => m);

  if (_.isEmpty(playingDiscordUsers)) {
    throw new Error(`No Players`)
    return;
  }

  return playingDiscordUsers;
}

async function giveUserRoles(interaction, discordUsers) {
  let minPlayers = 5;

  if (discordUsers.length < minPlayers) {
    throw new Error(`Not enough players (need at least ${minPlayers})`)
  }

  const currentCharacters = await computeCharacters(
    discordUsers.length,
    interaction.guild.id
  );

  return await crateUserData(interaction, currentCharacters, discordUsers) 
}

module.exports = {
  startGame,
  getPlayingDiscordUsers,
  channelNames,
  characters,
};
