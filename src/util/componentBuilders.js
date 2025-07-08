const _ = require("lodash");
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { selectCharacterList, roleList } = require("./botMessages/player-roles");
const { settingsList } = require("./botMessages/settings");
const { commandList } = require("./botMessages/commandsDescriptions");
const { powerUpList } = require("./botMessages/powerUpMessages");

function selectCharacterActionRow() {
  const selectMenuCharacterSelection = new StringSelectMenuBuilder()
    .setCustomId("character-selection")
    .setPlaceholder("Select characters")
    .setMinValues(1)
    .setMaxValues(selectCharacterList.length)  
    .addOptions(_.map(selectCharacterList, (character) => new StringSelectMenuOptionBuilder()
      .setLabel(character.label)
      .setDescription(`team ${character.team}`)
      .setValue(character.tag)
      .setEmoji(character.emoji)
    ))
    return new ActionRowBuilder().addComponents(selectMenuCharacterSelection)
}

function selectPowerUpModal() {  
  const modal = new ModalBuilder()
    .setCustomId('power-up-setting-modal')
    .setTitle('Power Up Settings');

  const input = new TextInputBuilder()
    .setCustomId('power-up-amount')
    .setLabel('Enter the amount of powers per player')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  
    const actionRowMenuPowerUpSelection = new ActionRowBuilder().addComponents(input)
    modal.addComponents(actionRowMenuPowerUpSelection)  
  return modal
}

function selectPowerUpActionRow() {
  const selectMenuPowerUpSelection = new StringSelectMenuBuilder()
  .setCustomId("power-up-selection")
  .setPlaceholder("Select power up")
  .setMinValues(1)
  .setMaxValues(powerUpList.length)  
  .addOptions(_.map(powerUpList, (powerUp) => new StringSelectMenuOptionBuilder()
    .setLabel(powerUp.label)
    .setDescription(powerUp.shortDescription)
    .setValue(powerUp.tag)
    .setEmoji(powerUp.emoji)
  ))

  return new ActionRowBuilder().addComponents(selectMenuPowerUpSelection);
}

function selectPowerUpDescriptionActionRow() {
  const selectMenuPowerUpSelection = new StringSelectMenuBuilder()
  .setCustomId("power-up-description")
  .setPlaceholder("Select power up")
  .setMinValues(1)
  .setMaxValues(1)
  .addOptions(_.map(powerUpList, (powerUp) => new StringSelectMenuOptionBuilder()
    .setLabel(powerUp.label)
    .setDescription(powerUp.shortDescription)
    .setValue(powerUp.tag)
    .setEmoji(powerUp.emoji)
  ))

  return new ActionRowBuilder().addComponents(selectMenuPowerUpSelection);
}

function selectSettingsActionRow() {
  const selectMenuSettings = new StringSelectMenuBuilder()
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

  return new ActionRowBuilder().addComponents(selectMenuSettings)
}

function selectCommandsActionRow() { 
  const selectMenuCommands = new StringSelectMenuBuilder()
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

  return new ActionRowBuilder().addComponents(selectMenuCommands)
}

function selectRolesActionRow() {
  const selectMenuRoles = new StringSelectMenuBuilder()
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

  return new ActionRowBuilder().addComponents(selectMenuRoles)
}


module.exports = {
  selectCharacterActionRow,
  selectPowerUpDescriptionActionRow,
  selectPowerUpModal,
  selectPowerUpActionRow,
  selectSettingsActionRow,
  selectCommandsActionRow,
  selectRolesActionRow,
}