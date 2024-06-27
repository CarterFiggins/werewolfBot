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
  // helps werewolves
  WEREWOLF: "werewolf",
  FOOL: "fool",
  LYCAN: "lycan",
  BAKER: "baker",
  MUTATED: "mutated villager",
  CUB: "werewolf cub",
  WITCH: "witch",
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
  [characters.VILLAGER, {         weight: 6, points: 3, helpsTeam: teams.VILLAGER }],
  [characters.SEER, {             weight: 3, points: 6, helpsTeam: teams.VILLAGER }],
  [characters.BODYGUARD, {        weight: 3, points: 6, helpsTeam: teams.VILLAGER }],
  [characters.APPRENTICE_SEER, {  weight: 4, points: 7, helpsTeam: teams.VILLAGER }],
  [characters.MASON, {            weight: 6, points: 4, helpsTeam: teams.VILLAGER }],
  [characters.HUNTER, {           weight: 6, points: 5, helpsTeam: teams.VILLAGER }],
  [characters.WEREWOLF, {         weight: 0, points: 6, helpsTeam: teams.WEREWOLF }], // weighted 0 because the number of werewolves are base off of number of players
  [characters.FOOL, {             weight: 5, points: 3, helpsTeam: teams.WEREWOLF }],
  [characters.LYCAN, {            weight: 6, points: 3, helpsTeam: teams.WEREWOLF }],
  [characters.BAKER, {            weight: 5, points: 6, helpsTeam: teams.WEREWOLF, onlyOne: true }],
  [characters.MUTATED, {          weight: 5, points: 4, helpsTeam: teams.WEREWOLF }],
  [characters.CUB, {              weight: 1, points: 7, helpsTeam: teams.WEREWOLF }],
  [characters.WITCH, {            weight: 6, points: 7, helpsTeam: teams.WEREWOLF, onlyOne: true }],
  [characters.DOPPELGANGER, {     weight: 3, points: 5, helpsTeam: teams.VILLAGER }],
  [characters.GROUCHY_GRANNY, {   weight: 6, points: 6, helpsTeam: teams.VILLAGER }],
]);

function getCards(settings) {
  const wolfCards = [
    characters.WEREWOLF,
    characters.CUB,
    characters.LYCAN,
  ];
  const villagerCards = [
    characters.SEER,
    characters.BODYGUARD,
    characters.MASON,
    characters.HUNTER,
    characters.VILLAGER,
  ];
  if (settings.random_cards) {
    wolfCards.push(characters.BAKER)
  }
  if (settings.extra_characters) {
    if (settings.random_cards) {
      wolfCards.push(characters.WITCH);
    }
    wolfCards.push(characters.MUTATED);
    wolfCards.push(characters.FOOL);
    villagerCards.push(characters.DOPPELGANGER);
    villagerCards.push(characters.APPRENTICE_SEER);
    villagerCards.push(characters.GROUCHY_GRANNY);
  }
  return {wolfCards, villagerCards}
}


module.exports = {
  characterInfoMap,
  characters,
  teams,
  getCards,
};