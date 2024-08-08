const { stopPlayingResponse } = require("../util/changeRoleHelpers");

module.exports = {
  data: { name: 'leave-game' },
  execute: async (interaction) => {
    await stopPlayingResponse(interaction);
  },
};