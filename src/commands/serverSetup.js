const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  commandNames,
  setupCommandPermissions,
} = require("../util/commandHelpers");
const { setupRoles } = require("../util/rolesHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SERVER_SETUP)
    .setDescription("Sets up the server's roles and permissions"),
  async execute(interaction) {
    await setupRoles(interaction);
    await setupCommandPermissions(interaction);
    await interaction.reply("Server is READY!");
  },
};
