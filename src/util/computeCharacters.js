const _ = require("lodash");
const { findSettings } = require("../werewolf_db");
const { characterInfoMap, characters, teams} = require("./characterHelpers/characterUtil");
const { DeckBalancer } = require("./characterHelpers/deckBalancer");


function createDeck(characterCards, numberOfPlayers) { 
  const oneEvery = (divNum) => Math.floor(numberOfPlayers / divNum);
  return _.shuffle(_.flatten(_.map(characterCards, (character) => {
    const characterInfo = characterInfoMap.get(character)
    if (characterInfo.onlyOne) {
      return character
    }
    return Array(oneEvery(characterInfo.frequency)).fill(character);
  })));
}

function startingCharacters(settings) {
  const standardCharacters = [characters.WEREWOLF];
  if (settings.random_cards) {
    return standardCharacters
  }
  if (settings.allow_vampires) {
    standardCharacters.push(characters.VAMPIRE)
  }
  return _.concat(standardCharacters, characters.SEER, characters.BODYGUARD, characters.MASON);
}

async function computeCharacters(numberOfPlayers, guildId) {
  const settings = await findSettings(guildId);

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

  const vampireCards = [
    characters.VAMPIRE,
  ];

  if (settings.extra_characters) {
    wolfCards.push(characters.MUTATED);
    wolfCards.push(characters.WITCH);
    wolfCards.push(characters.FOOL);
    villagerCards.push(characters.DOPPELGANGER);
    villagerCards.push(characters.APPRENTICE_SEER);
    villagerCards.push(characters.GROUCHY_GRANNY);
  }

  let werewolfDeck = createDeck(wolfCards, numberOfPlayers);
  let villagerDeck = createDeck(villagerCards, numberOfPlayers);
  let vampireDeck = createDeck(vampireCards, numberOfPlayers);
  if (settings.random_cards) {
    // make sure seer, bodyguard can be picked
    villagerDeck.concat(characters.SEER, characters.BODYGUARD);
  }

  const balance = new DeckBalancer(settings);
  const cardsInGame = startingCharacters(settings);
  cardsInGame.forEach((character) => balance.addCharacterPoints(character));

  let playersLeftOver = numberOfPlayers - cardsInGame.length;

  _.forEach(_.range(playersLeftOver), () => {
    let newCharacter = characters.VILLAGER
    if (balance.nextTeam() === teams.VILLAGER) {
      newCharacter = _.sample(villagerDeck);
    } else if (balance.nextTeam() === teams.WEREWOLF) {
      newCharacter = _.sample(werewolfDeck);
    } else if (balance.nextTeam() === teams.VAMPIRE) {
      newCharacter = _.sample(vampireDeck);
    }
    const characterInfo = characterInfoMap.get(newCharacter)
    if (characterInfo?.onlyOne) {
      // remove cards that should only have one per game
      if (characterInfo.helpsTeam === teams.VILLAGER) {
        villagerDeck = villagerDeck.filter((c) => c !== newCharacter)
      } else if (characterInfo.helpsTeam === teams.WEREWOLF) {
        werewolfDeck = werewolfDeck.filter((c) => c !== newCharacter)
      } else if (characterInfo.helpsTeam === teams.VAMPIRE) {
        vampireDeck = vampireDeck.filter((c) => c !== newCharacter)
      }
    }
    cardsInGame.push(balance.addCharacterPoints(newCharacter));
  });

  return _.shuffle(cardsInGame);
}

module.exports = computeCharacters;
