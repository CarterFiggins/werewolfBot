const { SlashCommandBuilder } = require("@discordjs/builders");
const { removeAllGameChannels } = require("../util/gameHelpers");
const { removeGameRolesFromMembers } = require("../util/rolesHelpers");
const { gameCommandPermissions } = require("../util/commandHelpers");
const schedule = require("node-schedule");
const {
  deleteAllUsers,
  deleteGame,
  deleteAllVotes,
  findAllUsers,
} = require("../werewolf_db");
const { commandNames } = require("../util/commandHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.REMOVE_GAME)
    .setDescription("end the game"),
  async execute(interaction) {
    const cursor = await findAllUsers(interaction.guild.id);
    const allUsers = await cursor.toArray();
    await deleteAllUsers(interaction.guild.id);
    const currentChannels = await interaction.guild.channels.fetch();
    removeAllGameChannels(currentChannels);
    const currentMembers = await interaction.guild.members.fetch();
    // removing all users game command permissions
    await gameCommandPermissions(interaction, allUsers, false);
    const roles = await interaction.guild.roles.fetch();
    await removeGameRolesFromMembers(currentMembers, roles);
    await schedule.gracefulShutdown();
    await deleteGame(interaction.guild.id);
    await deleteAllVotes(interaction.guild.id);
    await interaction.reply({ content: "Game Ended", ephemeral: true });
  },
};
