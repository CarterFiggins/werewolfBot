const _ = require("lodash");
const { selectPowerUpModal } = require("../util/componentBuilders");
const { PowerUpNames } = require("../util/powerUpHelpers");
const { updateAdminSettings } = require("../werewolf_db");

module.exports = {
  data: { name: 'power-up-selection' },
  sendResponse: async (interaction) => {
    interaction.showModal(selectPowerUpModal())
    const guildId = interaction.guild.id
    let powers = interaction.values

    if (interaction.values.length === 1 && powers[0] === "select-all") {
      powers = _.map(PowerUpNames, (p) =>  p)
    }
    powers = _.filter(powers, (character) => character !== "select-all")
    await updateAdminSettings(guildId, { powers })
  }
}