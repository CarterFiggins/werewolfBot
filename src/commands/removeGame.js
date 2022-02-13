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
    // stop scheduling day and night
    await interaction.deferReply();
    await schedule.gracefulShutdown();

    // Remove Channels
    const currentChannels = await interaction.guild.channels.fetch();
    removeAllGameChannels(currentChannels);

    // removing all users game command permissions
    const cursor = await findAllUsers(interaction.guild.id);
    const allUsers = await cursor.toArray();
    await gameCommandPermissions(interaction, allUsers, false);

    // remove all discord roles from players
    const roles = await interaction.guild.roles.fetch();
    const currentMembers = await interaction.guild.members.fetch();
    await removeGameRolesFromMembers(currentMembers, roles);

    // delete all game info from database
    await deleteAllUsers(interaction.guild.id);
    await deleteGame(interaction.guild.id);
    await deleteAllVotes(interaction.guild.id);

    await interaction.editReply({ content: "Game Ended", ephemeral: true });
  },
};
