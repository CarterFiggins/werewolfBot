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
};

const teams = {
  WEREWOLF: 'werewolf_team',
  VILLAGER: 'villager_team',
  VAMPIRE: 'vampire_team',
}

const characterInfoMap = new Map([
  [characters.VILLAGER, { frequency: 5, points: 3, helpsTeam: teams.VILLAGER }],
  [characters.SEER, { frequency: 14, points: 6, helpsTeam: teams.VILLAGER }],
  [characters.BODYGUARD, { frequency: 12, points: 6, helpsTeam: teams.VILLAGER }],
  [characters.APPRENTICE_SEER, { frequency: 10, points: 7, helpsTeam: teams.VILLAGER }],
  [characters.MASON, { frequency: 7, points: 4, helpsTeam: teams.VILLAGER }],
  [characters.HUNTER, { frequency: 8, points: 5, helpsTeam: teams.VILLAGER }],
  [characters.WEREWOLF, { frequency: 10, points: 6, helpsTeam: teams.WEREWOLF }],
  [characters.FOOL, { frequency: 8, points: 3, helpsTeam: teams.WEREWOLF }],
  [characters.LYCAN, { frequency: 7, points: 3, helpsTeam: teams.WEREWOLF }],
  [characters.BAKER, { frequency: 10, points: 6, helpsTeam: teams.WEREWOLF, onlyOne: true }],
  [characters.MUTATED, { frequency: 9, points: 4, helpsTeam: teams.WEREWOLF }],
  [characters.CUB, { frequency: 12, points: 8, helpsTeam: teams.WEREWOLF }],
  [characters.WITCH, { frequency: 10, points: 7, helpsTeam: teams.WEREWOLF, onlyOne: true }],
  [characters.DOPPELGANGER, { frequency: 10, points: 5, helpsTeam: teams.VILLAGER }],
  [characters.GROUCHY_GRANNY, { frequency: 10, points: 6, helpsTeam: teams.VILLAGER }],
]);

function getCards(settings) {
  const wolfCards = [
    characters.LYCAN,
    characters.BAKER,
    characters.WEREWOLF,
    characters.CUB,
  ];
  const villagerCards = [
    characters.SEER,
    characters.BODYGUARD,
    characters.MASON,
    characters.HUNTER,
    characters.VILLAGER,
  ];
  if (settings.extra_characters) {
    wolfCards.push(characters.MUTATED);
    wolfCards.push(characters.WITCH);
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