const _ = require("lodash");
const {updateUser, findAdminSettings} = require("../werewolf_db");

const PowerUpNames = {
  GUN: "gun",
  SHIELD: "shield",
  ALLIANCE_DETECTOR: "alliance_detector",
  PREDATOR_VISION: "predator_vision",
}

const PowersWithWeightsVillagers = {
  [PowerUpNames.PREDATOR_VISION]: 1,
  [PowerUpNames.GUN]: 3,
  [PowerUpNames.SHIELD]: 4,
  [PowerUpNames.ALLIANCE_DETECTOR]: 5,
};

const PowersWithWeightsWerewolves = {
  [PowerUpNames.ALLIANCE_DETECTOR]: 1,
  [PowerUpNames.GUN]: 3,
  [PowerUpNames.SHIELD]: 4,
  [PowerUpNames.PREDATOR_VISION]: 5,
};

function filterPowerUps(dbPowers, powerWeights) {
  return _.reduce(powerWeights, (powers, weight, name) => {
    if (dbPowers.includes(name)) {
      powers[name] = weight
    }
    return powers
  }, {})
}

async function randomWeightPowerUp(interaction, isWerewolf) {
  const {powers: dbPowers, powerUpAmount} = await findAdminSettings(interaction.guild.id)
  const playerPowers = {};

  let currentWeight = 0
  const powerWeights = isWerewolf ? PowersWithWeightsWerewolves : PowersWithWeightsVillagers
  const powers = _.map(filterPowerUps(dbPowers, powerWeights), (weight, name) => {
    currentWeight += weight
    return {name, weight: currentWeight}
  })

  _.forEach(_.range(powerUpAmount), () => {
    const randomWeight = Math.floor(Math.random() * _.last(powers).weight);
    const power = _.find(powers, (power) => power.weight > randomWeight)
    if (playerPowers[power.name]) {
      playerPowers[power.name] += 1;
    } else {
      playerPowers[power.name] = 1;
    }
  })
  return playerPowers
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
