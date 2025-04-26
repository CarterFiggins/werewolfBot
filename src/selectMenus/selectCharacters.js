const _ = require("lodash");
const { characterData: defaultCharacters } = require("../util/botMessages/player-roles");
const { updateAdminSettings, findAdminSettings } = require("../werewolf_db");
const { characters } = require("../util/characterHelpers/characterUtil");
const { ButtonBuilder } = require("@discordjs/builders");
const { ActionRowBuilder } = require("@discordjs/builders");
const { ButtonStyle } = require("discord.js");
const { getCapitalizeCharacterName } = require("../util/userHelpers");

module.exports = {
  data: { name: 'character-selection' },
  sendResponse: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    let charactersInGame = interaction.values
    const guildId = interaction.guild.id
    if (interaction.values.length === 1 && charactersInGame[0] === "select-all") {
      charactersInGame = _.map(defaultCharacters, (c) => c.tag)
    }
    charactersInGame = _.filter(charactersInGame, (character) => character !== "select-all")

    const villains = [
      characters.WEREWOLF,
      characters.VAMPIRE,
      characters.CHAOS_DEMON,
      characters.CUB,
    ]

    const hasVillain = _.some(charactersInGame, (character) => {
      return villains.includes(character)
    })

    if (!hasVillain) {
      await interaction.editReply({
        content: `\`\`\`diff
- Character Selection Failed: Need to have a villain in character selection e.g. werewolf
\`\`\``,
        ephemeral: true,
      });
      return
    }

    const adminSettings = await findAdminSettings(guildId)
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    if (!_.isEmpty(adminSettings?.characters)) {
      const oldMessages = []
      try {
        for (const characterDbInfo of adminSettings.characters) {
          oldMessages.push(await channel.messages.fetch(characterDbInfo.message_id));
        }
        // If message is older than 14 days it will throw an error
        await channel.bulkDelete(oldMessages)
      } catch (error) {
        if (error.message = "You can only bulk delete messages that are under 14 days old.") {
          for (const oldMessage of oldMessages) {
            // deleting messages one by one.
            oldMessage.delete()
          }
        } else {
          console.warn(error)
        }
      }
    } else {
      await channel.send("# Current Selection")
    }

    const characterData = []
    
    for (const characterName of charactersInGame) {
      const removeCard = new ButtonBuilder()
        .setCustomId(`remove-character&&${characterName}`)
        .setLabel('-1')
        .setStyle(ButtonStyle.Primary);

      const addCard = new ButtonBuilder()
        .setCustomId(`add-character&&${characterName}`)
        .setLabel('+1')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder()
			.addComponents(removeCard, addCard);

      const characterMessage = getCapitalizeCharacterName(characterName)

      const message = await channel.send({
        content: `## ${characterMessage}: 1`,
        components: [row],
      })

      characterData.push({
        character: characterName,
        count: 1,
        message_id: message.id,
      })
    }

    await updateAdminSettings(guildId, { characters: characterData })

    await interaction.editReply({
      content: "Successfully selected characters for game.",
      ephemeral: true,
    });
  },
};
