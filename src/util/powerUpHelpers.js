const _ = require("lodash");

const PowerUpNames = {
  GUN: "gun",
  SHIELD: "shield",
  ALLIANCE_DETECTOR: "alliance_detector",
  PREDATOR_VISION: "predator_vision",
}

const PowersWithWeightsVillagers = [
  {
    name: PowerUpNames.GUN,
    weight: 3,
  },
  {
    name: PowerUpNames.SHIELD,
    weight: 4,
  },
  {
    name: PowerUpNames.ALLIANCE_DETECTOR,
    weight: 5,
  },
]


const PowersWithWeightsWerewolves = [
  {
    name: PowerUpNames.GUN,
    weight: 3,
  },
  {
    name: PowerUpNames.SHIELD,
    weight: 4,
  },
  {
    name: PowerUpNames.PREDATOR_VISION,
    weight: 5,
  },
]

function randomWeightPowerUp(isWerewolf) {
  let currentWeight = 0
  const powerWeights = isWerewolf ? PowersWithWeightsWerewolves : PowersWithWeightsVillagers
  const powers = _.map(powerWeights, (power) => {
    currentWeight += power.weight
    return {name: power.name, weight: currentWeight}
  })

  const randomWeight = Math.floor(Math.random() * _.last(powers).weight);
  const power = _.find(powers, (power) => power.weight > randomWeight)
  return power.name
}

module.exports = {
  PowerUpNames,
  randomWeightPowerUp,
};
