const _ = require("lodash");
const { characterData } = require("../util/botMessages/player-roles");
const { addAdminCharacters } = require("../werewolf_db");

module.exports = {
  data: { name: 'character-selection' },
  sendResponse: async (interaction) => {
    let charactersInGame = interaction.values
    if (interaction.values.length === 1 && charactersInGame[0] === "select-all") {
      charactersInGame = _.map(characterData, (c) => c.tag)
    }
    charactersInGame = _.filter(charactersInGame, (character) => character !== "select-all")
    await addAdminCharacters(interaction.guild.id, charactersInGame)

    await interaction.reply({
      content: "Successfully selected characters for game.",
      ephemeral: true,
    });
  },
};
