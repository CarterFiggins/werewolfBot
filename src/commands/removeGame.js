const { SlashCommandBuilder } = require("@discordjs/builders");
const { removeAllGameChannels } = require("../util/gameHelpers");
const { removeGameRolesFromMembers, isAdmin } = require("../util/rolesHelpers");
const { gameCommandPermissions } = require("../util/commandHelpers");
const { channelNames } = require("../util/channelHelpers");
const schedule = require("node-schedule");
const {
  deleteAllUsers,
  deleteGame,
  deleteManyVotes,
  findAllUsers,
} = require("../werewolf_db");
const { commandNames } = require("../util/commandHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.REMOVE_GAME)
    .setDescription("end the game"),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      await interaction.editReply({
        content: "You don't have the permissions to end the game",
        ephemeral: true,
      });
      return;
    }

    const interactionChannel = interaction.guild.channels.cache.get(
      interaction.channelId
    );

    let wrongChannel = false;
    await Promise.all(
      Object.entries(channelNames).map(async ([_, channelName]) => {
        if (channelName === interactionChannel.name) {
          await interaction.reply({
            content:
              "Don't end game in channel that will be deleted. Try general",
            ephemeral: true,
          });
          wrongChannel = true;
        }
      })
    );

    if (wrongChannel) {
      return;
    }

    // stop scheduling day and night
    await interaction.deferReply({ ephemeral: true });
    await schedule.gracefulShutdown();

    // Remove Channels
    const currentChannels = await interaction.guild.channels.fetch();
    await removeAllGameChannels(currentChannels);

    // ***** Discord js is broken *****
    // removing all users game command permissions
    // const cursor = await findAllUsers(interaction.guild.id);
    // const allUsers = await cursor.toArray();
    // await gameCommandPermissions(interaction, allUsers, false);

    // remove all discord roles from players
    const roles = await interaction.guild.roles.fetch();
    const currentMembers = await interaction.guild.members.fetch();
    await removeGameRolesFromMembers(currentMembers, roles);

    // delete all game info from database
    await deleteAllUsers(interaction.guild.id);
    await deleteGame(interaction.guild.id);
    await deleteManyVotes({ guild_id: interaction.guild.id });

    await interaction.editReply({ content: "Game Ended", ephemeral: true });
  },
};
