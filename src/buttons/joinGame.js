const { playingResponse } = require("../util/changeRoleHelpers");

module.exports = {
  data: { name: 'join-game' },
  execute: async (interaction) => {
    await playingResponse(interaction);
  },
};