const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findUser, findGame, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { PowerUpNames, usePowerUp } = require("../util/powerUpHelpers");
const { syncBlackmailedVotes } = require("../util/powerUp/blackmailHelper");
const { sendMemberMessage } = require("../util/botMessages/sendMemberMessages");
const { organizeChannels } = require("../util/channelHelpers");
const { fetchMember } = require("../util/discordHelpers");


module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.BLACKMAIL)
    .setDescription("Power up command: blackmail a player so they have to vote with you today")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to blackmail")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) || (!dbUser?.power_ups[PowerUpNames.BLACKMAIL]),
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
    const targetedMember = await fetchMember(interaction, targetedUser.id);
    const targetDbUser = await findUser(targetedUser.id, guildId);

    if (!targetedMember) {
      await interaction.reply({
        content: "Could not find that player in the server. Try again.",
        ephemeral: true,
      });
      return;
    }
    if (!game.is_day) {
      await interaction.reply({
        content: "It is night time. You can only blackmail during the day",
        ephemeral: true,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.reply({
        content: `I have no secrets for you to use. Try again`,
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
        content: `Can't blackmail yourself. Try again!`,
        ephemeral: true,
      });
      return;
    }
    if (dbUser.blackmailed_by_user_id) {
      await interaction.reply({
        content: `You are being blackmailed and can't blackmail anyone else today.`,
        ephemeral: true,
      });
      return;
    }
    if (targetDbUser.blackmailed_by_user_id) {
      await interaction.reply({
        content: `${targetedUser} is already being blackmailed today. Try again!`,
        ephemeral: true,
      });
      return;
    }
    if (targetDbUser.is_muted) {
      await interaction.reply({
        content: `${targetedUser} is in the Granny's house and can't be blackmailed. Try again!`,
        ephemeral: true,
      });
      return;
    }

    await updateUser(targetDbUser.user_id, guildId, {
      blackmailed_by_user_id: interaction.user.id,
    })
    await usePowerUp(dbUser, interaction, PowerUpNames.BLACKMAIL);
    await syncBlackmailedVotes(guildId, interaction.user.id);
    await sendMemberMessage(targetedMember, `📜 You found an anonymous note. Someone has dirt on you! For the rest of today your vote will follow theirs and you can't change it.`)

    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);
    await organizedChannels.afterLife.send(
      `📜 ${interaction.member} is blackmailing ${targetedUser}. ${targetedUser} will vote with them today.`
    );

    await interaction.reply({
      content: `📜 ${targetedUser} is being blackmailed! For the rest of today their vote will follow yours.`,
      ephemeral: true,
    });
  }
}
