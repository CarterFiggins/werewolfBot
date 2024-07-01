const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { isAdmin } = require("../util/rolesHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.ANNOUNCE_NEW_GAME)
    .setDescription("ADMIN COMMAND: announce new game and add buttons to join game"),
  async execute(interaction) {

    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () => !isAdmin(interaction.member),
    });

    if (deniedMessage) {
      await interaction.editReply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const joinGame = new ButtonBuilder()
      .setCustomId('join-game')
      .setLabel('Join Game')
      .setStyle(ButtonStyle.Primary);

		const leaveGame = new ButtonBuilder()
      .setCustomId('leave-game')
      .setLabel('Leave Game')
      .setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder()
			.addComponents(joinGame, leaveGame);
    
    await interaction.reply({
      content: `New game! Click Here to join the next game.`,
      ephemeral: false,
      components: [row],
		});
  }
};
