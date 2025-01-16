const _ = require("lodash");
const { teams, characterInfoMap, getCards } = require("./characterUtil");
const { characters } = require("./characterUtil");


function createDeck(characterCards) { 
  let currentWeight = 0
  return _.map(characterCards, (character) => {
    const characterInfo = characterInfoMap.get(character)
    currentWeight += characterInfo.weight
    return { character,  weight: currentWeight, onlyOne: characterInfo.onlyOne, numberOfCards: 0 }
  });
}

class DeckBalancer{
  constructor(adminCharacters, startingWerewolfCards, startingVillagerCards) {
    this.villager = { points: 0, team: teams.VILLAGER };
    this.werewolf = { points: 0, team: teams.WEREWOLF };
    const playingCards = getCards(adminCharacters);
    this.startingVillagerCards = startingVillagerCards;
    this.startingWerewolfCards = startingWerewolfCards;
    this.villagerDeck = createDeck(playingCards.villagerCards);
    this.werewolfDeck = createDeck(playingCards.wolfCards);
    this.onlyOneCards = [];
  }

  selectNextCharacter() {
    let newCard = null
    const nextTeam = this.nextTeam()
    if (nextTeam === teams.VILLAGER) {
      const startingVillagerCharacter = this.startingVillagerCards.pop()
      const startingVillagerCard = { character: startingVillagerCharacter }
      newCard = startingVillagerCharacter ? startingVillagerCard : this.findRandomWeightedCard(this.villagerDeck)
    } else if (nextTeam === teams.WEREWOLF) {
      const startingWerewolfCharacter = this.startingWerewolfCards.pop()
      const startingWerewolfCard = { character: startingWerewolfCharacter }
      newCard = startingWerewolfCharacter ? startingWerewolfCard : this.findRandomWeightedCard(this.werewolfDeck)
    }

    if (!newCard) {
      console.warn(`${nextTeam} does not have a deck. Defaulted to villager`)
      newCard = { character: characters.VILLAGER}
    }

    this.addCharacterPoints(newCard.character)
    return newCard.character
  }

  findRandomWeightedCard(deck) {
    let card = null;
    let foundCard = false;
    if (_.isEmpty(deck)) {
      return { character: characters.VILLAGER }
    }
    const maxWeight = _.last(deck).weight;
    while (!foundCard) {
      const randomWeight = Math.floor(Math.random() * maxWeight);
      card = _.find(deck, (card) => card.weight > randomWeight);
      if (!card.onlyOne || card.numberOfCards === 0) {
        foundCard = true;
        card.numberOfCards += 1
      }
    }

    return card
  }

  addCharacterPoints(character) {
    if (!character) {
      console.warn("No character was found. Defaulting to villager")
      character = characters.VILLAGER
    }
    const characterInfo = characterInfoMap.get(character);
    if (!characterInfo) {
      return character
    }

    if (characterInfo.helpsTeam === teams.VILLAGER) {
      this.villager.points += characterInfo.points;
    } else if (characterInfo.helpsTeam === teams.WEREWOLF) {
      this.werewolf.points += characterInfo.points;
    }
    return character
  }

  nextTeam() {
    const teams = [this.villager, this.werewolf]
    return _.minBy(teams, (t) => t.points ).team
  }

  get villagerPoints() {
    return this.villager.points
  }
  get werewolfPoints() {
    return this.werewolf.points
  }

}

module.exports = {
  DeckBalancer
}

