const _ = require("lodash");
const { findAdminSettings } = require("../../werewolf_db");

/* 
To add a new character add it to these
  1. characters list below
  3. add a channel for character?
gameHelpers
  1. add characters powers in the buildUser switch statement
  2. Add character in character map
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
  MONARCH: "monarch",
  // helps werewolves
  WEREWOLF: "werewolf",
  FOOL: "fool",
  LYCAN: "lycan",
  BAKER: "baker",
  MUTATED: "mutated villager",
  CUB: "werewolf cub",
  WITCH: "witch",
  // Other teams
  VAMPIRE: "king",
  CHAOS_DEMON: "chaos demon",
};

const teams = {
  WEREWOLF: 'werewolf_team',
  VILLAGER: 'villager_team',
  VAMPIRE: 'vampire_team',
  CHAOS: 'chaos_tem'
}

// weight = higher numbers are more likely to be picked
// points = how much points goes the team it helps the team with the lowest points get the next card
// helpsTeam = shows what team the character helps if in the game.
// onlyOne = only one of these characters are in the game.
const characterInfoMap = new Map([
  [characters.VILLAGER, {         weight: 5, points: 2, helpsTeam: teams.VILLAGER }],
  [characters.SEER, {             weight: 2, points: 6, helpsTeam: teams.VILLAGER }],
  [characters.BODYGUARD, {        weight: 2, points: 6, helpsTeam: teams.VILLAGER }],
  [characters.APPRENTICE_SEER, {  weight: 3, points: 7, helpsTeam: teams.VILLAGER }],
  [characters.MASON, {            weight: 4, points: 4, helpsTeam: teams.VILLAGER }],
  [characters.HUNTER, {           weight: 5, points: 4, helpsTeam: teams.VILLAGER }],
  [characters.WEREWOLF, {         weight: 1, points: 7, helpsTeam: teams.WEREWOLF }],
  [characters.FOOL, {             weight: 3, points: 5, helpsTeam: teams.WEREWOLF }],
  [characters.LYCAN, {            weight: 5, points: 2, helpsTeam: teams.WEREWOLF }],
  [characters.BAKER, {            weight: 5, points: 6, helpsTeam: teams.WEREWOLF, onlyOne: true }],
  [characters.MUTATED, {          weight: 3, points: 5, helpsTeam: teams.WEREWOLF }],
  [characters.CUB, {              weight: 2, points: 8, helpsTeam: teams.WEREWOLF }],
  [characters.WITCH, {            weight: 6, points: 7, helpsTeam: teams.WEREWOLF, onlyOne: true }],
  [characters.DOPPELGANGER, {     weight: 3, points: 5, helpsTeam: teams.VILLAGER }],
  [characters.GROUCHY_GRANNY, {   weight: 3, points: 6, helpsTeam: teams.VILLAGER }],
  [characters.MONARCH, {          weight: 3, points: 6, helpsTeam: teams.VILLAGER }],
  [characters.VAMPIRE, {          weight: 0, points: 0, helpsTeam: teams.VAMPIRE }],
  [characters.CHAOS_DEMON, {      weight: 0, points: 0, helpsTeam: teams.CHAOS }],
]);

defaultCharacters = [
  characters.WEREWOLF,
  characters.BAKER,
  characters.LYCAN,
  characters.VILLAGER,
  characters.SEER,
  characters.BODYGUARD,
  characters.HUNTER,
]

function getCards(adminCharacters) {
  const allCards = {
    wolfCards: [],
    villagerCards: [],
    otherCards: [],
  }

  _.forEach(adminCharacters, (role) => {
    if (characterInfoMap.get(role).helpsTeam === teams.WEREWOLF) {
      allCards.wolfCards.push(role)
    } else if (characterInfoMap.get(role).helpsTeam === teams.VILLAGER) {
      allCards.villagerCards.push(role)
    } else {
      allCards.otherCards.push(role)
    }
  })

  return allCards
}

async function getCurrentCharacters(guildId) {
  const adminSettings = await findAdminSettings(guildId)
  const characterData = adminSettings?.characters
  const currentCharacters = _.map(characterData, (info) => info.character)
  if (_.isEmpty(currentCharacters)) {
    return { currentCharacters: defaultCharacters }
  }

  const cardsInGame = []
  _.forEach(characterData, (info) => {
    _.forEach(_.range(info.count), () => {
      cardsInGame.push(info.character)
    })
  })

  return { currentCharacters, cardsInGame }
}


module.exports = {
  characterInfoMap,
  characters,
  teams,
  getCards,
  defaultCharacters,
  getCurrentCharacters,
};