const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { setupRoles } = require("../util/rolesHelpers");
const { createSettings } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SERVER_SETUP)
    .setDescription("Sets up the server's roles and permissions"),
  async execute(interaction) {
    await interaction.client.application.fetch();
    if (interaction.guild.client.application.owner.id !== interaction.user.id) {
      await interaction.reply({
        content:
          "Only the owner of the server has permission to setup the server",
        ephemeral: true,
      });
      return;
    }

    await setupRoles(interaction);
    // ***** currently broken on Discord js *****
    // await setupCommandPermissions(interaction);
    await createSettings({
      guild_id: interaction.guild.id,
      day_time: "8:00",
      night_time: "20:00",
      can_whisper: false,
    });
    await interaction.reply("Server is READY!");
  },
};
