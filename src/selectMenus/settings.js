const _ = require("lodash");
const { settingsList } = require("../util/botMessages/settings");
const { findSettings } = require("../werewolf_db");

module.exports = {
  data: { name: 'settings' },
  sendResponse: async (interaction) => {
    const settingName = interaction.values[0]
    
    const setting = _.find(settingsList, (setting) => setting.label === settingName)
    if (!setting) {
      await interaction.reply({
        content: `${settingName} not found.`,
        ephemeral: true,
      });
      console.warn(`Warning: ${settingName} was not found in select menu settings`)
    }

    const gameSettings = await findSettings(interaction.guild.id)
    const isActive = gameSettings[setting.id]

    await interaction.reply({
      content: `${setting.description}\nStatus: ${isActive ? 'Active' : 'Off'}`,
      ephemeral: true,
    });
  },
};
