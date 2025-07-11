const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames, characters } = require("../util/commandHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { organizeChannels } = require("../util/channelHelpers");
const { findSettings, findUser, updateUser } = require("../werewolf_db");
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
    const userDb = await findUser(interaction.user.id, interaction.guild.id)
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser: userDb,
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

    if (userDb.character === characters.MONARCH) {
      await interaction.editReply({
        content:
          "The Monarch can not whisper.",
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
    const playerUserDb = await findUser(player.id, interaction.guild.id)
    const message = interaction.options.getString("message");
    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);

    if (!isAlive(playerMember)) {
      await interaction.editReply({
        content: "Whispering to the departed? They're great listeners, but they've got a no-reply policy in their current state. Try selecting someone who is alive.",
        ephemeral: true,
      });
      return;
    }

    if (playerUserDb.is_muted) {
      await interaction.editReply({
        content: "They have been muted by the granny. Looks like your whispers will have to wait until they find their way back from Granny's bad side!",
        ephemeral: true,
      });
      return;
    }
    if (userDb.whisper_count > 0) {
      await interaction.editReply({
        content: "You have already used your whisper for today. Try again after the day is over.",
        ephemeral: true,
      });
      return;
    }

    try {
      await senderMember.send(
        `You whispered to ${
          playerMember.nickname || player.username
        }\n${message}\n`
      );
    } catch (e) {
      console.error(e);
      await interaction.editReply({
        content: "You are currently blocking or not allowing messages from the werewolf bot.",
        ephemeral: true,
      });
      return;
    }

    // send message to player from the bot.
    try {
      await playerMember.send(
        `(${interaction?.guild?.name}) Whisper from ${
          senderMember.nickname || messageSender.username
        } id: ${senderMember.id}\n${message}\n`
      );
    } catch (e) {
      console.error(e);
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
    await updateUser(userDb.user_id, interaction.guild.id, {
      whisper_count: userDb.whisper_count+1,
    });
  },
};
