const _ = require("lodash");
const { commandList } = require("../util/botMessages/commandsDescriptions");
const { replyViewAll } = require("../util/botMessages/messageHelpers");

module.exports = {
  data: { name: 'commands' },
  sendResponse: async (interaction) => {
    const commandName = interaction.values[0]
    if (commandName === "View All") {
      replyViewAll(interaction, commandList)
      return;
    }
    
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
