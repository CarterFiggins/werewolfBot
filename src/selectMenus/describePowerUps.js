const _ = require("lodash");
const { replyViewAll } = require("../util/botMessages/messageHelpers");
const { powerUpList } = require("../util/botMessages/powerUpMessages");

module.exports = {
  data: { name: 'power-up-description' },
  sendResponse: async (interaction) => {
    const powerUpName = interaction.values[0]
    if (powerUpName === "select-all") {
      replyViewAll(interaction, powerUpList, true)
      return
    }

    const power = _.find(powerUpList, (power) => power.tag === powerUpName)

    if (!power) {
      await interaction.reply({
        content: `${powerUpName} not found.`,
        ephemeral: true,
      });
      console.warn(`Warning: ${powerUpName} was not found in power up drop down`)
    }

    await interaction.reply({
      content: `${power.label}: ${ power.description }`,
      ephemeral: true,
    });
  }
}