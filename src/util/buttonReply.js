const _ = require("lodash");
const { findAdminSettings, updateAdminSettings } = require("../werewolf_db");
const { getCapitalizeCharacterName } = require("./userHelpers");

async function editCharacterCount(interaction, amount) {
  await interaction.deferReply({ ephemeral: true });
  const adminSettings = await findAdminSettings(interaction.guild.id)

  let total = 0;
  let characterData = {}
  _.forEach(adminSettings.characters, (c) => {
    if (c.character === interaction.buttonData) {
      const newAmount = c.count + amount
      if (newAmount <= 0) {
        c.count = 0;
      } else {
        c.count = newAmount;
      }
      characterData = c
    } 
    total += c.count
    
  })

  const channel = interaction.guild.channels.cache.get(interaction.channelId);
  const message = await channel.messages.fetch(characterData.message_id)
  await message.edit(`## ${getCapitalizeCharacterName(characterData.character)}: ${characterData.count}`)

  await updateAdminSettings(interaction.guild.id, adminSettings)

  await interaction.editReply({
    content: `Total: ${total}`,
    ephemeral: true,
  })
}

module.exports = {
  editCharacterCount,
};