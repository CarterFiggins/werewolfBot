const { editCharacterCount } = require("../util/buttonReply");

module.exports = {
  data: { name: 'add-character' },
  execute: async (interaction) => {
    await editCharacterCount(interaction, 1);
  },
};