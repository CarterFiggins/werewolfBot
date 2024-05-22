const _ = require("lodash");
const { commandList } = require("../util/botMessages/commandsDescriptions");

module.exports = {
  name: 'commands',
  sendResponse: async (interaction) => {
    const commandName = interaction.values[0]
    const command = _.find(commandList, (command) => command.label === commandName)

    if (!command) {
      await interaction.reply({
        content: `${commandName} not found.`,
        ephemeral: true,
      });
      console.warn(`Warning: ${commandName} was not found in howToPlay`)
    }

    await interaction.reply({
      content: command.description,
      ephemeral: true,
    });
  },
};
