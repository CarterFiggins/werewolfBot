const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findUser, findGame, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { PowerUpNames, usePowerUp } = require("../util/powerUpHelpers");
const { removeNightPowerForUser, removeVotesFromStun } = require("../util/powerUp/stunHelper");
const { sendMemberMessage } = require("../util/botMessages/sendMemberMessages");
const { organizeChannels } = require("../util/channelHelpers");


module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.STUN)
    .setDescription("Power up command: Stun a player")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to stun")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) || (!dbUser?.power_ups[PowerUpNames.STUN]),
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const guildId = interaction.guild.id
    const game = await findGame(guildId);
    const targetedUser = await interaction.options.getUser("target");
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);
    const targetDbUser = await findUser(targetedUser.id, guildId);

    if (game.first_night) {
      await interaction.reply({
        content:
          "It is the first night. Try again tomorrow",
        ephemeral: true,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.reply({
        content: `Can't stun me. Try again`,
        ephemeral: true,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.reply({
        content: `${targetedUser} is already dead! try again.`,
        ephemeral: true,
      });
      return;
    }
    if (targetDbUser.user_id === interaction.user.id) {
      await interaction.reply({
        content: `Can't stun yourself. Try again!`,
        ephemeral: true,
      });
      return;
    }
    if (targetDbUser.is_muted) {
      await interaction.reply({
        content: `${targetedUser} is in the Granny's house and can't be stunned. Try again!`,
        ephemeral: true,
      });
      return;
    }

    
    await updateUser(targetDbUser.user_id, guildId, {
      is_stunned: true,
    })
    await usePowerUp(dbUser, interaction, PowerUpNames.STUN);
    await removeVotesFromStun(guildId, targetDbUser.user_id);
    await removeNightPowerForUser(interaction, targetDbUser);
    await sendMemberMessage(targetedMember, `You got stunned and will not be able to use your commands.`)

    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);
    await organizedChannels.afterLife.send(
      `${interaction.member} has stunned ${targetedUser}`
    );

    await interaction.reply({
      content: `${targetedUser} has been stunned!`,
      ephemeral: true,
    });
  }
}
