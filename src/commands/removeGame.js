const { SlashCommandBuilder } = require("@discordjs/builders");
const { removeAllGameChannels } = require("../util/gameHelpers");
const { removeGameRolesFromMembers } = require("../util/rolesHelpers");
const schedule = require("node-schedule");
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
    deleteAllUsers(interaction.guild.id);
    const currentChannels = await interaction.guild.channels.fetch();
    removeAllGameChannels(currentChannels);
    const currentMembers = await interaction.guild.members.fetch();
    const roles = await interaction.guild.roles.fetch();
    await removeGameRolesFromMembers(currentMembers, roles);
    await schedule.gracefulShutdown();
    await deleteGame(interaction.guild.id);
    await deleteAllVotes(interaction.guild.id);
    await interaction.reply({ content: "Game Ended", ephemeral: true });
  },
};
