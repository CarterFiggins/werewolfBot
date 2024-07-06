const { playingResponse } = require("../util/playingHelpers");

module.exports = {
  data: { name: 'join-game' },
  execute: async (interaction) => {
    await playingResponse(interaction);
  },
};