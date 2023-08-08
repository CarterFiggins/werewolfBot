const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { organizeChannels } = require("../util/channelHelpers");
const { findSettings } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.WHISPER)
    .setDescription(
      "Talk to player privately. The dead and non players will see what was said."
    )
    .addUserOption((option) =>
      option
        .setName("player")
        .setDescription("name of player to send message")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message that will be sent")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const settings = await findSettings(interaction.guild?.id);

    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () => !isAlive(interaction.member) || !settings.can_whisper,
    });

    if (deniedMessage) {
      await interaction.editReply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.guild.channels.cache.get(interaction.channelId);

    if (channel.name === channelNames.OUT_CASTS) {
      await interaction.reply({
        content:
          "You are to far away! They can not hear you",
        ephemeral: true,
      });
      return;
    }

    const messageSender = interaction.user;
    const senderMember = await interaction.guild.members.fetch(
      messageSender.id
    );
    const player = interaction.options.getUser("player");
    const playerMember = await interaction.guild.members.fetch(player.id);
    const message = interaction.options.getString("message");
    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);

    if (!isAlive(playerMember)) {
      await interaction.editReply({
        content: "psst you can only whisper to people who are alive.",
        ephemeral: true,
      });
      return;
    }

    // send message to player from the bot.
    try {
      await playerMember.send(
        `Whisper from ${
          senderMember.nickname || messageSender.username
        }\n${message}\n`
      );
    } catch (e) {
      console.log(e);
      await interaction.editReply({
        content: "The player might be blocking the bot. Message did not send",
        ephemeral: true,
      });
      return;
    }

    // send message to after life
    await organizedChannels.afterLife.send(
      `${messageSender} has whisper to ${player}\n${message}`
    );

    await interaction.editReply({
      content: `Message was Sent\n${message}`,
      ephemeral: true,
    });
  },
};
