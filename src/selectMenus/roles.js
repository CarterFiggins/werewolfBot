const _ = require("lodash");
const { roleList } = require("../util/botMessages/player-roles");
const { replyViewAll } = require("../util/botMessages/messageHelpers");

module.exports = {
  data: { name: 'roles' },
  sendResponse: async (interaction) => {
    const roleName = interaction.values[0]
    if (roleName === "View All") {
      replyViewAll(interaction, roleList)
      return;
    }

    const role = _.find(roleList, (role) => role.label === roleName)
    if (!role) {
      await interaction.reply({
        content: `${roleName} not found.`,
        ephemeral: true,
      });
      console.warn(`Warning: ${roleName} was not found in howToPlay`)
    }

    await interaction.reply({
      content: role.description,
      ephemeral: true,
    });
  },
};
