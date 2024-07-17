const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { isAdmin } = require("../util/rolesHelpers");
const { updateSettings, findSettings } = require("../werewolf_db");

const SettingCommands = {
  DAY_TIME: "day_time",
  NIGHT_TIME: "night_time",
  RANDOM_CARDS: "random_cards",
  CAN_WHISPER: "can_whisper",
  ALLOW_REACTIONS: "allow_reactions",
  EXTRA_CHARACTERS: "extra_characters",
  WOLF_KILLS_WITCH: "wolf_kills_witch",
  HARD_MODE: "hard_mode",
  ALLOW_CHAOS_DEMON: 'allow_chaos_demon',
  ALLOW_VAMPIRES: "allow_vampires",
  ALLOW_FIRST_BITE: "allow_first_bite",
  ALWAYS_BITE_TWO: "always_bite_two",
  KING_BITE_WOLF_SAFE: "king_bite_wolf_safe",
  KING_VICTIM_ATTACK_SAFE: "king_victim_attack_safe",
  VIEW: "view",
  BODYGUARD_JOINS_MASONS: "bodyguard_joins_masons",
  SEER_JOINS_MASONS: "seer_joins_masons",
  HUNTER_GUARD: "hunter_guard",
  ENABLE_POWER_UPS: "enable_power_ups",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SETTINGS)
    .setDescription("settings for game")
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.VIEW)
        .setDescription("view current settings")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.DAY_TIME)
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
        .setName(SettingCommands.NIGHT_TIME)
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
        .setName(SettingCommands.RANDOM_CARDS)
        .setDescription(
          "ADMIN COMMAND: no set limit on any characters and chosen at random"
        )
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("turn setting off or on")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.CAN_WHISPER)
        .setDescription(
          "ADMIN COMMAND: The ability to whisper to another player using the bot"
        )
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("turn setting off or on")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.ALLOW_REACTIONS)
        .setDescription(
          "ADMIN COMMAND: The ability to react to another player's massage in game channels"
        )
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("Set setting true or false")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.EXTRA_CHARACTERS)
        .setDescription(
          "ADMIN COMMAND: Characters added: mutated villager, witch, fool, doppelganger, and apprentice seer"
        )
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("Set setting true or false")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.WOLF_KILLS_WITCH)
        .setDescription(
          "ADMIN COMMAND: If true wolf kills the witch. If false the witch will join the werewolf chat"
        )
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("Set setting true or false")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.HARD_MODE)
        .setDescription(
          "ADMIN COMMAND: When player dies there character will not be reviled and will not see team count"
        )
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("Set setting true or false")
        )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName(SettingCommands.ALLOW_CHAOS_DEMON)
      .setDescription("ADMIN COMMAND: Allow the Chaos Demon character to play")
      .addBooleanOption((option) =>
        option
          .setName("activate")
          .setRequired(true)
          .setDescription("Set setting true or false")
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName(SettingCommands.ALLOW_VAMPIRES)
      .setDescription("ADMIN COMMAND: Allow the vampire character to play")
      .addBooleanOption((option) =>
        option
          .setName("activate")
          .setRequired(true)
          .setDescription("Set setting true or false")
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName(SettingCommands.ALLOW_FIRST_BITE)
      .setDescription(
        "ADMIN COMMAND: Vampires king's first bite will transform a player into a vampire"
      )
      .addBooleanOption((option) =>
        option
          .setName("activate")
          .setRequired(true)
          .setDescription("Set setting true or false")
      )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.ALWAYS_BITE_TWO)
        .setDescription(
          "ADMIN COMMAND: The vampire king only needs to bite a player once to transform a player"
        )
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("Set setting true or false")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.KING_BITE_WOLF_SAFE)
        .setDescription(
          "ADMIN COMMAND: The vampire king will not die when trying to bite a werewolf"
        )
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("Set setting true or false")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.KING_VICTIM_ATTACK_SAFE)
        .setDescription(
          "ADMIN COMMAND: The vampire king will not die if they bite the same player the werewolves kill"
        )
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("Set setting true or false")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.BODYGUARD_JOINS_MASONS)
        .setDescription("ADMIN COMMAND: The Bodyguard can join the masons")
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("Set setting true or false")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.SEER_JOINS_MASONS)
        .setDescription("ADMIN COMMAND: The Seer can join the masons")
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("Set setting true or false")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.HUNTER_GUARD)
        .setDescription("ADMIN COMMAND: Hunter will kill one werewolf when attacked by werewolves")
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("Set setting true or false")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SettingCommands.ENABLE_POWER_UPS)
        .setDescription("ADMIN COMMAND: players will also get one power up at the start of the game")
        .addBooleanOption((option) =>
          option
            .setName("activate")
            .setRequired(true)
            .setDescription("Set setting true or false")
        )
    ),
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

    if (command === SettingCommands.VIEW) {
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
      command === SettingCommands.DAY_TIME ||
      command === SettingCommands.NIGHT_TIME
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

    const activate = interaction.options.getBoolean("activate");
    data[command] = activate;
    await updateSettings(guildId, data);

    await interaction.editReply({
      content: `${command} has been set to ${activate}`,
      ephemeral: true,
    });
  },
};
