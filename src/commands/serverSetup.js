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
const { playerRolesIntro, characterSelectionIntro } = require("../util/botMessages/player-roles");
const { settingsIntro } = require("../util/botMessages/settings");
const { selectCharacterActionRow, selectSettingsActionRow, selectPowerUpActionRow, selectCommandsActionRow, selectRolesActionRow, selectPowerUpDescriptionActionRow } = require("../util/componentBuilders");
const { powerUpSelectionIntro } = require("../util/botMessages/powerUpMessages");

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

    if (!settings) {
      await createSettings({
        server_name: interaction.guild.name,
        guild_id: interaction.guild.id,
        day_time: "8:00",
        night_time: "20:00",
        random_cards: false,
        can_whisper: false,
        allow_reactions: false,
        wolf_kills_witch: false,
        hard_mode: false,
        allow_first_bite: true,
        king_bite_wolf_safe: true,
        king_victim_attack_safe: true,
        bodyguard_joins_masons: true,
        seer_joins_masons: false,
        hunter_guard: false,
        allow_lycan_guard: true,
        enable_power_ups: false,
        double_hanging: false,
        admin_controls_cards: false,
      });
    }

    await interaction.client.application.fetch();
    await setupRoles(interaction);

    const channels = await interaction.guild.channels.fetch();
    const adminRole = await getRole(interaction, roleNames.ADMIN);
    const adminPermissions = {
      id: adminRole.id,
      allow: [
        PermissionsBitField.Flags.Administrator,
        PermissionsBitField.Flags.ViewChannel,
      ],
    };
    const nonPlayersPermissions = {
      id: interaction.guild.id,
      deny: [
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.CreatePrivateThreads,
        PermissionsBitField.Flags.CreatePublicThreads,
        PermissionsBitField.Flags.SendMessagesInThreads,
      ],
      allow: [PermissionsBitField.Flags.ViewChannel],
    };

    const denyEveryonePermissions = {
      id: interaction.guild.id,
      deny: [
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.CreatePrivateThreads,
        PermissionsBitField.Flags.CreatePublicThreads,
        PermissionsBitField.Flags.SendMessagesInThreads,
        PermissionsBitField.Flags.ViewChannel,
      ],
      allow: [],
    };

    channels.map(async (channel) => {
      switch (channel.name) {
        case setupChannelNames.HOW_TO_PLAY:
        case setupChannelNames.COMMANDS:
        case setupChannelNames.PLAYER_ROLES:
        case setupChannelNames.GAME_INSTRUCTIONS:
        case setupChannelNames.SETTINGS:
        case setupChannelNames.ADMIN_SETTINGS:
          await channel.delete()
      }
    });

    gameInstructionsCategory = await createCategory(interaction, { name: setupChannelNames.GAME_INSTRUCTIONS });
    gameInstructionsCategory.setPosition(0);

    
    howToPlayChannel = await createChannel(
      interaction,
      setupChannelNames.HOW_TO_PLAY,
      [adminPermissions, nonPlayersPermissions],
      gameInstructionsCategory
    );
    await howToPlayChannel.send(howToPlayIntro);
    await howToPlayChannel.send(howToPlayRoles);
    await howToPlayChannel.send(orderOfOperations);
    await howToPlayChannel.send(villagerTeam);
    await howToPlayChannel.send(werewolfTeam);
    await howToPlayChannel.send(vampireTeam);
    await howToPlayChannel.send(soloCharacters);
    await howToPlayChannel.send(undeterminedTeam);

    
    playerRolesChannel = await createChannel(
      interaction,
      setupChannelNames.PLAYER_ROLES,
      [adminPermissions, nonPlayersPermissions],
      gameInstructionsCategory
    );

    await playerRolesChannel.send(playerRolesIntro);
    await playerRolesChannel.send({
      components: [selectRolesActionRow()],
    });
    

    commandsChannel = await createChannel(
      interaction,
      setupChannelNames.COMMANDS,
      [adminPermissions, nonPlayersPermissions],
      gameInstructionsCategory
    );

    await commandsChannel.send({
      components: [selectPowerUpDescriptionActionRow()],
    })

    await commandsChannel.send({
      components: [selectCommandsActionRow()],
    })

    settingChannnel = await createChannel(
      interaction,
      setupChannelNames.SETTINGS,
      [adminPermissions, nonPlayersPermissions],
      gameInstructionsCategory
    );
  
    await settingChannnel.send(settingsIntro);
    await settingChannnel.send({
      components: [selectSettingsActionRow()],
    });

    const adminSettingsChannel = await createChannel(
      interaction,
      setupChannelNames.ADMIN_SETTINGS,
      [adminPermissions, denyEveryonePermissions],
      gameInstructionsCategory
    );

    await adminSettingsChannel.send("# Admin Settings");
    await adminSettingsChannel.send({
      content: powerUpSelectionIntro,
      components: [selectPowerUpActionRow()],
    });
    await adminSettingsChannel.send({
      content: characterSelectionIntro,
      components: [selectCharacterActionRow()],
    });

    await interaction.editReply({
      content: "Server is READY!",
      ephemeral: true,
    });
  },
};
