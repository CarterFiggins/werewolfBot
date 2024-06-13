const { stopPlayingResponse } = require("../util/playingHelpers");

module.exports = {
  data: { name: 'leave-game' },
  execute: async (interaction) => {
    await stopPlayingResponse(interaction);
  },
};