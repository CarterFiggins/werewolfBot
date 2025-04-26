const { buttonResponse } = require("./buttonResponse");
const { commandResponse } = require("./command");
const { modalResponse } = require("./modalResponse");
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
      modalResponse(interaction)
    }
  },
};
