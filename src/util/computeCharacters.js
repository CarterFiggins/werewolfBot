const _ = require("lodash");
const { findSettings } = require("../werewolf_db");
const { characterInfoMap, characters, teams, getCards} = require("./characterHelpers/characterUtil");
const { DeckBalancer } = require("./characterHelpers/deckBalancer");

function startingCharacters(settings, numberOfPlayers) {
  const werewolvesPerPlayers = settings.allow_vampires ? 5 : 4
  const werewolvesToAdd = Math.floor(numberOfPlayers/werewolvesPerPlayers) || 1
  const startingCards = [];
  _.forEach(_.range(werewolvesToAdd), () => {
    startingCards.unshift(characters.WEREWOLF)
  })
  
  if (settings.allow_vampires) {
    startingCards.unshift(characters.VAMPIRE)
  }
  if (settings.allow_chaos_demon) {
    startingCards.unshift(characters.CHAOS_DEMON)
  }
  if (settings.random_cards) {
    return { cardsInGame: startingCards, werewolfCards: [], villagerCards: []}
  }

  startingCards.unshift(
    characters.MASON,
    characters.BODYGUARD,
    characters.SEER,
  )

  const werewolfCards = [
    characters.LYCAN,
    characters.BAKER,
  ]

  const villagerCards = [
    characters.MASON,
    characters.HUNTER,
  ]

  if (settings.extra_characters) {
    werewolfCards.push(
      characters.MUTATED,
      characters.WITCH,
      characters.FOOL,
    )
    villagerCards.push(
      characters.DOPPELGANGER,
      characters.APPRENTICE_SEER,
      characters.GROUCHY_GRANNY,
    )
  }

  return { cardsInGame: startingCards, werewolfCards: _.shuffle(werewolfCards), villagerCards: _.shuffle(villagerCards) }
}

async function computeCharacters(numberOfPlayers, guildId) {
  const settings = await findSettings(guildId);
  const { cardsInGame, werewolfCards, villagerCards } = startingCharacters(settings, numberOfPlayers);
  const balance = new DeckBalancer(settings, werewolfCards, villagerCards);
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
