const { buttonResponse } = require("./buttonResponse");
const { commandResponse } = require("./command");
const { selectMenuResponse } = require("./selectMenuResponse");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.isCommand()) {
      commandResponse(interaction)
    } else if (interaction.isAnySelectMenu()) {
      selectMenuResponse(interaction)
    } else if (interaction.isButton()) {
      buttonResponse(interaction)
    } else if (interaction.isModalSubmit()) {
      await interaction.reply({
        content: "You did a good thing",
        ephemeral: true,
      });
    }
  },
};
