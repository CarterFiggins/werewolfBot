const _ = require("lodash");
const { characterData } = require("../util/botMessages/player-roles");
const { addAdminCharacters } = require("../werewolf_db");
const { characterInfoMap, teams } = require("../util/characterHelpers/characterUtil");

module.exports = {
  data: { name: 'character-selection' },
  sendResponse: async (interaction) => {
    let charactersInGame = interaction.values
    if (interaction.values.length === 1 && charactersInGame[0] === "select-all") {
      charactersInGame = _.map(characterData, (c) => c.tag)
    }
    charactersInGame = _.filter(charactersInGame, (character) => character !== "select-all")

    const hasVillain = _.some(charactersInGame, (character) => {
      const characterInfo = characterInfoMap.get(character)
      return characterInfo.helpsTeam !== teams.VILLAGER
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


    await addAdminCharacters(interaction.guild.id, charactersInGame)

    await interaction.reply({
      content: "Successfully selected characters for game.",
      ephemeral: true,
    });
  },
};
