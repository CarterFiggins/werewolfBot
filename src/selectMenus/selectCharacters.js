const _ = require("lodash");
const { characterData } = require("../util/botMessages/player-roles");
const { updateAdminSettings, findAdminSettings } = require("../werewolf_db");
const { characters } = require("../util/characterHelpers/characterUtil");


async function sendNewMessage(guildId, channel, characterMessage) {
  const message = await channel.send(characterMessage)
  await updateAdminSettings(guildId, { message_id: message.id})
}

module.exports = {
  data: { name: 'character-selection' },
  sendResponse: async (interaction) => {
    let charactersInGame = interaction.values
    const guildId = interaction.guild.id
    if (interaction.values.length === 1 && charactersInGame[0] === "select-all") {
      charactersInGame = _.map(characterData, (c) => c.tag)
    }
    charactersInGame = _.filter(charactersInGame, (character) => character !== "select-all")

    const villains = [
      characters.WEREWOLF,
      characters.VAMPIRE,
      characters.CHAOS_DEMON,
    ]

    const hasVillain = _.some(charactersInGame, (character) => {
      return villains.includes(character)
    })

    if (!hasVillain) {
      await interaction.reply({
        content: `\`\`\`diff
- Character Selection Failed: Need to have a villain in character selection e.g. werewolf
\`\`\``,
        ephemeral: true,
      });
      return
    }

    await updateAdminSettings(guildId, { characters: charactersInGame })

    const characterMessage = ` # Current Selection
## ${charactersInGame.sort().join("\n# ")}`
    const adminSettings = await findAdminSettings(guildId)
    const channel = interaction.guild.channels.cache.get(interaction.channelId);

    if (adminSettings.message_id) {
      try {
        const oldMessage = await channel.messages.fetch(adminSettings.message_id)
        oldMessage.edit(characterMessage)
      } catch (error) {
        console.warn(error)
        await sendNewMessage(guildId, channel, characterMessage)
      }
    } else {
      await sendNewMessage(guildId, channel, characterMessage)
    }

    await interaction.reply({
      content: "Successfully selected characters for game.",
      ephemeral: true,
    });
  },
};
