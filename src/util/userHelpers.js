const _ = require("lodash");
const { getRole, roleNames, organizeRoles } = require("../util/rolesHelpers");
const { characters } = require("./commandHelpers");
const { createUsers, findSettings } = require("../werewolf_db");
const { randomWeightPowerUp } = require("./powerUpHelpers");
const { possibleCharactersInGame } = require("./channelHelpers");
require("dotenv").config();

async function getPlayingCount(interaction) {
  let playingRole = await getRole(interaction, roleNames.PLAYING);
  const members = await interaction.guild.members.fetch();

  let playersCount = 0;
  const playingMembers = [];
  members.forEach((member) => {
    if (member._roles.includes(playingRole.id)) {
      playersCount += 1;
      playingMembers.push(member)
    }
  });
  return {playersCount, playingMembers};
}

async function buildUserInfo(interaction, user, newCharacter) {
  const roles = await interaction.guild.roles.fetch();
  const organizedRoles = organizeRoles(roles)
  const member = interaction.guild.members.cache.get(user.id);
  await member.roles.add(organizedRoles.alive);
  await member.roles.remove(organizedRoles.playing);
  
  return {
    user_id: user.id,
    name: user.username,
    nickname: member.nickname,
    character: newCharacter,
    guild_id: interaction.guild.id,
    is_vampire: false,
    is_henchman: false,
    is_cub: false,
    is_dead: false,
    is_injured: false,
    is_stunned: false,
    whisper_count: 0,
    vampire_bites: 0,
    has_lycan_guard: false,
    assigned_identity: newCharacter,
    kill_targeted_user_ids: [],
    power_ups: {},
  };
}

function shuffleUsers(users) {
  if (process.env.TESTING_MODE) { 
    return users;
  }
  return _.shuffle(users);
}

function getCapitalizeCharacterName(characterName) {
  return characterName === characters.VAMPIRE ? `Vampire ${_.capitalize(characterName)}` : _.capitalize(characterName);
}

async function crateUserData(interaction, newCharacters, discordUsers) {
  const dbUsers = [];
  const settings = await findSettings(interaction.guild.id);
  let shuffledUsers = shuffleUsers(discordUsers)
  const possibleFakeAssignment = _.intersection(
    [characters.VILLAGER, characters.BAKER, characters.HUNTER, characters.APPRENTICE_SEER],
    await possibleCharactersInGame(interaction),
  )

  if (_.isEmpty(possibleFakeAssignment)) {
    possibleFakeAssignment.push(characters.VILLAGER)
  }

  for (let i = 0; i < shuffledUsers.length; i++) {
    const user = shuffledUsers[i];
    
    const newCharacter = _.isEmpty(newCharacters)
      ? characters.DOPPELGANGER
      : newCharacters.pop();
  
    user.info = await buildUserInfo(interaction, user, newCharacter)

    switch (newCharacter) {
      case characters.FOOL:
      case characters.SEER:
        user.info.assigned_identity = characters.SEER;
        break;
      case characters.CUB:
        user.info.is_cub = true;
        user.info.character = characters.WEREWOLF;
        user.info.assigned_identity = characters.WEREWOLF;
        user.info.kill_targeted_user_ids = [];
        break;
      case characters.WEREWOLF:
        user.info.kill_targeted_user_ids = [];
        break;
      case characters.BODYGUARD:
        user.info.last_guarded_user_id = null;
        break;
      case characters.VAMPIRE:
        user.info.bite_user_id = null;
        user.info.is_vampire = true;
        user.info.first_bite = true;
        break;
      case characters.LYCAN:
        if (settings.allow_lycan_guard) {
          user.info.has_lycan_guard = true;
        }
        user.info.assigned_identity = _.sample(possibleFakeAssignment)
        break;
      case characters.MUTATED:
        user.info.assigned_identity = _.sample(possibleFakeAssignment)
        break;
      case characters.MONARCH:
        user.info.given_power_ups = [];
        user.info.given_to_user_ids = [];
        user.info.giving_user_id = null;
        user.info.giving_power = null;
        break;
    }

    if (settings.enable_power_ups) {
      user.info.power_ups = await randomWeightPowerUp(interaction, characters.WEREWOLF === newCharacter)
    }
    dbUsers.push(user.info);
  }
  await createUsers(dbUsers);
  return shuffledUsers;
}

function getPlayersCharacter(dbUser) {
  if (dbUser.is_vampire) {
    return `vampire ${dbUser.character}`
  }
  if (dbUser.is_cub) {
    return `Werewolf cub`
  }
  if (dbUser.is_henchman) {
    return `${dbUser.character} Henchman`
  }

  return dbUser.character
}

module.exports = {
  getPlayingCount,
  crateUserData,
  getPlayersCharacter,
  getCapitalizeCharacterName
};
