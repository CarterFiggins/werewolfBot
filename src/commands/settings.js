const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { isAdmin } = require("../util/rolesHelpers");
const { updateSettings, findSettings } = require("../werewolf_db");
const { settingsList } = require("../util/botMessages/settings");

const valueSettings = {
  DAY_TIME: "day_time",
  NIGHT_TIME: "night_time",
  VIEW: "view",
}

function buildSlashCommand() {
  const builder = new SlashCommandBuilder()
    .setName(commandNames.SETTINGS)
    .setDescription("settings for game")
    .addSubcommand((subcommand) =>
      subcommand
        .setName(valueSettings.VIEW)
        .setDescription("view current settings")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(valueSettings.DAY_TIME)
        .setDescription(
          "ADMIN COMMAND: The time when day starts. The bot will announce who died durning the night"
        )
        .addNumberOption((option) =>
          option
            .setName("hour")
            .setRequired(true)
            .setDescription("A number between 0 - 23")
        )
        .addNumberOption((option) =>
          option
            .setName("minute")
            .setRequired(true)
            .setDescription("A number from 0 - 59")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(valueSettings.NIGHT_TIME)
        .setDescription(
          "ADMIN COMMAND: The time when night starts. The bot announce who will be hanged"
        )
        .addNumberOption((option) =>
          option
            .setName("hour")
            .setRequired(true)
            .setDescription("A number between 0 - 23 (24-hour clock format)")
        )
        .addNumberOption((option) =>
          option
            .setName("minute")
            .setRequired(true)
            .setDescription("A number from 0 - 59")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('edit')
        .setDescription(
          "ADMIN COMMAND: Turn on and off settings"
        )
        .addStringOption((option) => {
          option
            .setName("setting")
            .setDescription("The name of the setting")
            .setRequired(true)
            _.forEach(settingsList, (setting) => {
              if (setting.id) {
                option.addChoices({ name: setting.label, value: setting.id })
              }
            })
          return option
        })
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("turn setting off or on")
        )
    )
  return builder
}


module.exports = {
  data: buildSlashCommand(),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const command = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const settings = await findSettings(guildId);

    if (!settings) {
      await interaction.editReply({
        content: "Settings not found. Run setup server",
        ephemeral: true,
      });
    }

    if (command === valueSettings.VIEW) {
      let message = "";
      delete settings._id;
      delete settings.server_name;
      delete settings.guild_id;
      Object.entries(settings).forEach(([key, value]) => {
        message += `${key.replaceAll("_", " ")}: ${value}\n`;
      });
      await interaction.editReply({
        content: message,
        ephemeral: true,
      });
      return;
    }

    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () => !isAdmin(interaction.member),
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const data = {};

    if (
      command === valueSettings.DAY_TIME ||
      command === valueSettings.NIGHT_TIME
    ) {
      const hour = interaction.options.getNumber("hour");
      const minute = interaction.options.getNumber("minute");

      if (hour < 0 || hour > 23) {
        await interaction.editReply({
          content: `Error: hour needs to be in between 0 and 23`,
          ephemeral: true,
        });
        return;
      }

      if (minute < 0 || minute > 59) {
        await interaction.editReply({
          content: `Error: minute needs to be in between 0 and 59`,
          ephemeral: true,
        });
        return;
      }

      const paddedMinute = _.padStart(`${minute}`, 2, "0");
      data[command] = `${hour}:${paddedMinute}`;
      await updateSettings(guildId, data);
      await interaction.editReply({
        content: `${command} has been set to ${hour}:${paddedMinute}`,
        ephemeral: true,
      });
      return;
    }

    const settingValue = interaction.options.getString("setting");
    const activate = interaction.options.getBoolean("activate");
    data[settingValue] = activate;
    await updateSettings(guildId, data);

    await interaction.editReply({
      content: `Setting has been set to ${activate}`,
      ephemeral: true,
    });
  },
};
