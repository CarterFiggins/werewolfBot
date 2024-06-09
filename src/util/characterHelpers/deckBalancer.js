const _ = require("lodash");
const { teams, characterInfoMap } = require("./characterUtil");
const { characters } = require("./characterUtil");


class DeckBalancer{
  constructor() {
    this.villager = { points: 0, team: teams.VILLAGER };
    this.werewolf = { points: 0, team: teams.WEREWOLF };
  }

  addCharacterPoints(character) {
    if (!character) {
      character = characters.villager
    }
    const characterInfo = characterInfoMap.get(character);
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

