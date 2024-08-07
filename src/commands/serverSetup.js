const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { PermissionsBitField, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const {
  setupRoles,
  isAdmin,
  getRole,
  roleNames,
} = require("../util/rolesHelpers");
const { findSettings, createSettings } = require("../werewolf_db");
const { createChannel, setupChannelNames, createCategory } = require("../util/channelHelpers");
const { howToPlayIntro, howToPlayRoles, villagerTeam, werewolfTeam, vampireTeam, undeterminedTeam, soloCharacters, orderOfOperations } = require("../util/botMessages/howToPlay");
const { commandList, commandsIntro } = require("../util/botMessages/commandsDescriptions");
const { playerRolesIntro, roleList } = require("../util/botMessages/player-roles");
const { settingsList, settingsIntro } = require("../util/botMessages/settings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SERVER_SETUP)
    .setDescription("ADMIN COMMAND: Sets up the server's roles and settings"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const settings = await findSettings(interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () => settings && !isAdmin(interaction.member),
    });

    if (deniedMessage) {
      await interaction.editReply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    await interaction.client.application.fetch();
    await setupRoles(interaction);

    const channels = await interaction.guild.channels.fetch();
    const adminRole = await getRole(interaction, roleNames.ADMIN);
    const adminPermissions = {
      id: adminRole.id,
      allow: [PermissionsBitField.Flags.Administrator],
    };
    const nonPlayersPermissions = {
      id: interaction.guild.id,
      deny: [
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags. CreatePrivateThreads,
        PermissionsBitField.Flags. CreatePublicThreads,
        PermissionsBitField.Flags. SendMessagesInThreads,
      ],
      allow: [PermissionsBitField.Flags.ViewChannel],
    };

    const setupChannels = {}

    channels.map(async (channel) => {
      if (channel.name === setupChannelNames.HOW_TO_PLAY) {
        setupChannels.howToPlay = channel;
      } else if (channel.name === setupChannelNames.COMMANDS) {
        setupChannels.commands = channel;
      } else if (channel.name === setupChannelNames.PLAYER_ROLES) {
        setupChannels.playerRoles = channel
      } else if (channel.name === setupChannelNames.GAME_INSTRUCTIONS) {
        setupChannels.gameInstructions = channel
      } else if (channel.name === setupChannelNames.SETTINGS) {
        setupChannels.settings = channel
      }
    });

    if (!setupChannels.gameInstructions) {
      setupChannels.gameInstructions = await createCategory(interaction, setupChannelNames.GAME_INSTRUCTIONS);
    }


    if (!setupChannels.howToPlay) {
      setupChannels.howToPlay = await createChannel(
        interaction,
        setupChannelNames.HOW_TO_PLAY,
        [adminPermissions, nonPlayersPermissions],
        setupChannels.gameInstructions
      );
      await setupChannels.howToPlay.send(howToPlayIntro);
      await setupChannels.howToPlay.send(howToPlayRoles);
      await setupChannels.howToPlay.send(orderOfOperations);
      await setupChannels.howToPlay.send(villagerTeam);
      await setupChannels.howToPlay.send(werewolfTeam);
      await setupChannels.howToPlay.send(vampireTeam);
      await setupChannels.howToPlay.send(soloCharacters);
      await setupChannels.howToPlay.send(undeterminedTeam);
    }

    if (!setupChannels.playerRoles) {
      setupChannels.playerRoles = await createChannel(
        interaction,
        setupChannelNames.PLAYER_ROLES,
        [adminPermissions, nonPlayersPermissions],
        setupChannels.gameInstructions
      );

      const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("roles")
      .setPlaceholder("Select Role")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(_.map(roleList, (role) => new StringSelectMenuOptionBuilder()
        .setLabel(role.label)
        .setDescription(`team ${role.team}`)
        .setValue(role.label)
        .setEmoji(role.emoji)
      ))
    
      const actionRow = new ActionRowBuilder().addComponents(selectMenu)
      await setupChannels.playerRoles.send(playerRolesIntro);
      await setupChannels.playerRoles.send({
        components: [actionRow],
      });
    }

    if (!setupChannels.commands) {
      setupChannels.commands = await createChannel(
        interaction,
        setupChannelNames.COMMANDS,
        [adminPermissions, nonPlayersPermissions],
        setupChannels.gameInstructions
      );

      await setupChannels.commands.send(commandsIntro);
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("commands")
        .setPlaceholder("Select command")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(_.map(commandList, (command) => new StringSelectMenuOptionBuilder()
          .setLabel(command.label)
          .setDescription(command.role)
          .setValue(command.label)
          .setEmoji(command.emoji)
        ))

      const actionRow = new ActionRowBuilder().addComponents(selectMenu)
      await setupChannels.commands.send({
        components: [actionRow],
      })
    }

    if (!settings) {
      await createSettings({
        server_name: interaction.guild.name,
        guild_id: interaction.guild.id,
        day_time: "8:00",
        night_time: "20:00",
        random_cards: false,
        can_whisper: false,
        allow_reactions: false,
        extra_characters: false,
        wolf_kills_witch: false,
        hard_mode: false,
        allow_chaos_demon: false,
        allow_vampires: false,
        allow_first_bite: true,
        king_bite_wolf_safe: true,
        king_victim_attack_safe: true,
        bodyguard_joins_masons: true,
        seer_joins_masons: false,
        hunter_guard: false,
        allow_lycan_guard: true,
        enable_power_ups: false,
      });
    }

    if (!setupChannels.settings) {
      setupChannels.settings = await createChannel(
        interaction,
        setupChannelNames.SETTINGS,
        [adminPermissions, nonPlayersPermissions],
        setupChannels.gameInstructions
      );

      const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("settings")
      .setPlaceholder("Select Setting")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(_.map(settingsList, (setting) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(setting.label)
          .setValue(setting.label)
          .setEmoji(setting.emoji)
        }
      ))
    
      const actionRow = new ActionRowBuilder().addComponents(selectMenu)
      await setupChannels.settings.send(settingsIntro);
      await setupChannels.settings.send({
        components: [actionRow],
      });
    }

    await interaction.editReply({
      content: "Server is READY!",
      ephemeral: true,
    });
  },
};
