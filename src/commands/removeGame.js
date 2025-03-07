const { SlashCommandBuilder } = require("@discordjs/builders");
const { removeGameRolesFromMembers, isAdmin } = require("../util/rolesHelpers");
const { channelNames, removeAllGameChannels } = require("../util/channelHelpers");
const {
  deleteAllUsers,
  deleteGame,
  deleteManyVotes,
} = require("../werewolf_db");
const { commandNames } = require("../util/commandHelpers");
const { endGuildJobs } = require("../util/schedulHelper");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.REMOVE_GAME)
    .setDescription("ADMIN COMMAND: end the game"),
  async execute(interaction) {
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () => !isAdmin(interaction.member),
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
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
              "Don't end game in channel that will be deleted. Try a channel outside of the game.",
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
    await endGame(interaction, roles, currentMembers, true)
    await interaction.editReply({ content: "Game Ended", ephemeral: true });
  },
};
