const { SlashCommandBuilder } = require("@discordjs/builders");
const { removeAllGameChannels } = require("../util/gameHelpers");
const {
  deleteAllUsers,
  deleteGame,
  deleteAllVotes,
} = require("../werewolf_db");
const { commandNames } = require("../util/commandHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.REMOVE_GAME)
    .setDescription("end the game"),
  async execute(interaction) {
    // Delete users from db
    deleteAllUsers();
    // remove channels
    const currentChannels = await interaction.guild.channels.fetch();
    removeAllGameChannels(currentChannels);
    await deleteGame(interaction.guild.id);
    await deleteAllVotes(interaction.guild.id);
    await interaction.reply({ content: "Game Ended", ephemeral: true });
  },
};
