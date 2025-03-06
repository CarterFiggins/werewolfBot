const { editCharacterCount } = require("../util/buttonReply");

module.exports = {
  data: { name: 'remove-character' },
  execute: async (interaction) => {
    await editCharacterCount(interaction, -1);
  },
};