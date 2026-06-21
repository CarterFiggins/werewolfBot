const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { buildAlivePlayersMessage } = require("../util/userHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.WHO_IS_ALIVE)
    .setDescription(
      "Shows which players are alive in the game and number of villagers and werewolves"
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
    });

    if (deniedMessage) {
      await interaction.editReply({
        content: deniedMessage,
        ephemeral: false,
      });
      return;
    }

    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const message = await buildAlivePlayersMessage(interaction, channel);

    await interaction.editReply({
      content: message,
      ephemeral: false,
      allowedMentions: { parse: [] },
    });
  },
};
