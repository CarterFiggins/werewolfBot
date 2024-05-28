const _ = require("lodash");
const { teams, characterInfoMap } = require("./characterUtil");
const { characters } = require("./characterUtil");


class DeckBalancer{
  constructor(settings) {
    this.villager = { points: 0, team: teams.VILLAGER };
    this.werewolf = { points: 0, team: teams.WEREWOLF };
    // vampires only have one card and it can only be in the game once
    // When more cards are added for vampires then set points to 0
    this.vampire = { points: 999999, team: teams.VAMPIRE };
    this.settings = settings;
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
    } else if (characterInfo.helpsTeam === teams.VAMPIRE) {
      this.vampire.points += characterInfo.points;
    }
    return character
  }

  nextTeam() {
    const teams = [this.villager, this.werewolf]
    if (this.settings.allow_vampires) {
      teams.push(this.vampire)
    }
    return _.minBy(teams, (t) => t.points ).team
  }

  get villagerPoints() {
    return this.villager.points
  }
  get werewolfPoints() {
    return this.werewolf.points
  }
  get vampirePoints() {
    return this.vampire.points
  }

}

module.exports = {
  DeckBalancer
}

