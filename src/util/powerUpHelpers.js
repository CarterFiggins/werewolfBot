const _ = require("lodash");

const PowerUpNames = {
  GUN: "gun",
  SHIELD: "shield",
}

function randomWeightPowerUp() {
  const weightedPowers = [
    {
      name: PowerUpNames.GUN,
      weight: 5,
    },
    {
      name: PowerUpNames.SHIELD,
      weight: 10,
    },
    {
      name: null,
      weight: 20,
    },
  ]
  const randomWeight = Math.floor(Math.random() * 20);
  const power = _.find(weightedPowers, (power) => power.weight > randomWeight)
  return power.name
}

module.exports = {
  PowerUpNames,
  randomWeightPowerUp,
};
