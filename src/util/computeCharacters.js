const _ = require("lodash");
const { findSettings } = require("../werewolf_db");
const { characters, teams, characterInfoMap, getCurrentCharacters } = require("./characterHelpers/characterUtil");
const { DeckBalancer } = require("./characterHelpers/deckBalancer");

function startingCharacters(settings, numberOfPlayers, currentCharacters) {
  const isPlaying = (playingCharacter) => _.find(currentCharacters, (c) => c === playingCharacter)

  werewolfIsPlaying = isPlaying(characters.WEREWOLF)
  vampireIsPlaying = isPlaying(characters.VAMPIRE)
  cubIsPlaying = isPlaying(characters.CUB)
  chaosDemonIsPlaying = isPlaying(characters.CHAOS_DEMON)
  masonIsPlaying = isPlaying(characters.MASON)
  bodyguardIsPlaying = isPlaying(characters.BODYGUARD)
  seerIsPlaying = isPlaying(characters.SEER)

  const werewolvesPerPlayers = vampireIsPlaying ? 6 : 5
  const werewolvesToAdd = werewolfIsPlaying ? (Math.floor(numberOfPlayers/werewolvesPerPlayers) || 1) : 0
  const startingCards = [];
  let wolfSubtract = 0;
  if (cubIsPlaying && werewolvesToAdd > 1 && Math.random() < 0.25) {
    startingCards.push(characters.CUB);
    wolfSubtract = 1;
  }
  _.forEach(_.range(werewolvesToAdd - wolfSubtract), () => {
    startingCards.unshift(characters.WEREWOLF)
  })
  
  if (vampireIsPlaying) {
    startingCards.unshift(characters.VAMPIRE)
  }
  if (chaosDemonIsPlaying) {
    startingCards.unshift(characters.CHAOS_DEMON)
  }

  if (settings.random_cards) {
    return { cardsInGame: startingCards, werewolfCards: [], villagerCards: []}
  }

  if (masonIsPlaying) {
    startingCards.unshift(
      characters.MASON,
      characters.MASON,
    )
  }

  if (bodyguardIsPlaying) {
    startingCards.unshift(characters.BODYGUARD)
  }

  if (seerIsPlaying) {
    startingCards.unshift(characters.SEER)
  }

  const filterCardTeams = (team) => {
    return _.difference(
      _.filter(currentCharacters, (role) => {
        const info = characterInfoMap.get(role)
        return info.helpsTeam === team
      }),
      startingCards
    )
  }

  const werewolfCards = filterCardTeams(teams.WEREWOLF)
  const villagerCards = filterCardTeams(teams.VILLAGER)

  return { cardsInGame: startingCards, werewolfCards: _.shuffle(werewolfCards), villagerCards: _.shuffle(villagerCards) }
}

async function computeCharacters(numberOfPlayers, guildId) {

  if (process.env.TESTING_MODE) {
    return [
      characters.VILLAGER,
      characters.DOPPELGANGER,
      characters.WEREWOLF,
      characters.CHAOS_DEMON,
      characters.SEER,
    ] 
  }

  const settings = await findSettings(guildId);
  const { currentCharacters, cardsInGame: adminSelectCards } = await getCurrentCharacters(guildId)
  
  if (settings.admin_controls_cards) {
    return _.shuffle(adminSelectCards)
  }

  const { cardsInGame, werewolfCards, villagerCards } = startingCharacters(settings, numberOfPlayers, currentCharacters);
  const balance = new DeckBalancer(currentCharacters, werewolfCards, villagerCards);
  cardsInGame.forEach((character) => {
    balance.addCharacterPoints(character)
  });

  let playersLeftOver = numberOfPlayers - cardsInGame.length;

  if (playersLeftOver <= 0) {
    return cardsInGame;
  }

  _.forEach(_.range(playersLeftOver), () => {
    cardsInGame.push(balance.selectNextCharacter());
  });

  return _.shuffle(cardsInGame);
}

module.exports = computeCharacters;
