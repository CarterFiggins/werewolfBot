const _ = require("lodash");
const {updateUser} = require("../werewolf_db");

const PowerUpNames = {
  GUN: "gun",
  SHIELD: "shield",
  ALLIANCE_DETECTOR: "alliance_detector",
  PREDATOR_VISION: "predator_vision",
}

const PowersWithWeightsVillagers = [
  {
    name: PowerUpNames.PREDATOR_VISION,
    weight: 1,
  },
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
    name: PowerUpNames.ALLIANCE_DETECTOR,
    weight: 1,
  },
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

async function grantPowerUp(user, interaction, powerUp) {
  user.power_ups = user.power_ups || {};
  if (!user.power_ups[powerUp]) {
    user.power_ups[powerUp] = 1;
  } else if (user.power_ups[powerUp] === true) {
    user.power_ups[powerUp] = 2;
  } else {
    user.power_ups[powerUp]++;
  }
  await updateUser(user.user_id, interaction.guild.id, {
    power_ups: user.power_ups,
  })
}

async function usePowerUp(user, interaction, powerUp) {
  if (!user.power_ups) {
    return;
  }
  if (user.power_ups[powerUp] === true) {
    user.power_ups[powerUp] = 0;
  } else if (user.power_ups[powerUp] > 0) {
    user.power_ups[powerUp]--;
  } else {
    user.power_ups[powerUp] = 0;
  }
  await updateUser(user.user_id, interaction.guild.id, {
    power_ups: user.power_ups,
  })
}

module.exports = {
  PowerUpNames,
  randomWeightPowerUp,
  usePowerUp,
  grantPowerUp,
};
