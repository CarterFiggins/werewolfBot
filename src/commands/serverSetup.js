const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { setupRoles, isAdmin } = require("../util/rolesHelpers");
const { findSettings, createSettings } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SERVER_SETUP)
    .setDescription("Sets up the server's roles and settings"),
  async execute(interaction) {
    const settings = await findSettings(interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () => settings && !isAdmin(interaction.member),
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
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
        allow_reactions: false,
      });
    }
    await interaction.reply("Server is READY!");
  },
};
