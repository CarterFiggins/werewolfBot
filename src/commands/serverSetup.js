const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { setupRoles } = require("../util/rolesHelpers");
const { findSettings, createSettings } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SERVER_SETUP)
    .setDescription("Sets up the server's roles and settings"),
  async execute(interaction) {
    const settings = await findSettings(interaction.guild.id);
    if (settings && !isAdmin(interaction.member)) {
      await interaction.reply({
        content: "You don't have the permissions to setup the server",
        ephemeral: true,
      });
      return;
    }

    await interaction.client.application.fetch();

    await setupRoles(interaction);

    if (!settings) {
      await createSettings({
        guild_id: interaction.guild.id,
        day_time: "8:00",
        night_time: "20:00",
        can_whisper: false,
      });
    }
    await interaction.reply("Server is READY!");
  },
};
