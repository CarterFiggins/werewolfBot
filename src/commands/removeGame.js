const { SlashCommandBuilder } = require("@discordjs/builders");
const { isAdmin } = require("../util/rolesHelpers");
const { channelNames } = require("../util/channelHelpers");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { endGame } = require("../util/endGameHelper");

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
    const roles = await interaction.guild.roles.fetch();
    const currentMembers = await interaction.guild.members.fetch();
    await endGame(interaction, roles, currentMembers, true);
    await interaction.editReply({ content: "Game Ended", ephemeral: true });
  },
};
