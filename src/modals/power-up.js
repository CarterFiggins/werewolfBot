const _ = require("lodash");
const { updateAdminSettings, findAdminSettings } = require("../werewolf_db");

async function editMessage(interaction, adminSettings, powerUpMessage) {
  const channel = interaction.guild.channels.cache.get(interaction.channelId);
  try {
    if (adminSettings.powerUpMessageId) {
      const message = await channel.messages.fetch(adminSettings.powerUpMessageId);
      await message.edit(powerUpMessage)
      return true
    }
    return false
  } catch (error) {
    return false
  }
}

module.exports = {
  data: { name: 'power-up-setting-modal' },
  sendResponse: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guild.id
    const amount = _.toNumber(interaction.fields.getTextInputValue('power-up-amount'));
    if (!amount) {
      await interaction.editReply({
        content: `\`\`\`diff
- Bad input. Needs a number. Try again
\`\`\``,
        ephemeral: true,
      });
      return;
    }
    await updateAdminSettings(guildId, { powerUpAmount: amount })

    const adminSettings = await findAdminSettings(guildId)
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const powerUpMessage = `## PowerUps\nPlayers get ${amount} random powers this game\nPowers selected: ${adminSettings.powers.join(', ')}`
    
    if (!await editMessage(interaction, adminSettings, powerUpMessage)) {
      const message = await channel.send(powerUpMessage)
      await updateAdminSettings(guildId, { powerUpMessageId: message.id })
    }
    await interaction.editReply({
      content: "Successfully selected Power ups",
      ephemeral: true,
    });
  },
};