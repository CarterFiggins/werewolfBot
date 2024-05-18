const _ = require("lodash");
const { roleList } = require("../util/botMessages/howToPlay");

module.exports = {
  name: 'roles',
  sendResponse: async (interaction) => {
    const roleName = interaction.values[0]
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
