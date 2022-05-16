const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames, characters } = require("../util/commandHelpers");
const {
  channelNames,
  giveMasonChannelPermissions,
} = require("../util/channelHelpers");
const { isAlive } = require("../util/rolesHelpers");
const {
  findGame,
  findUser,
  updateUser,
  updateGame,
} = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.GUARD)
    .setDescription("guard a player for the night")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to guard")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild.id);
    if (
      !isAlive(interaction.member) ||
      dbUser.character !== characters.BODYGUARD
    ) {
      await interaction.reply({
        content: "Permission denied",
        ephemeral: true,
      });
      return;
    }

    const targetedUser = await interaction.options.getUser("target");
    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);
    const guardUser = await findUser(interaction.user.id, interaction.guild.id);

    let message;

    if (channel.name !== channelNames.BODYGUARD) {
      await interaction.reply({
        content: "You can only guard in the bodyguard channel.",
        ephemeral: true,
      });
      return;
    }
    if (game.is_day) {
      await interaction.reply({
        content: "It is day time. Your power works at night.",
        ephemeral: false,
      });
      return;
    }
    if (!guardUser.guard) {
      await interaction.reply({
        content:
          "You are tired and can only guard one person. Try again next night.",
        ephemeral: false,
      });
      return;
    }
    if (guardUser.last_guarded_user_id == targetedUser.id) {
      await interaction.reply({
        content: `You guarded ${targetedUser} last night and can not protect someone twice in a row.`,
        ephemeral: false,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.reply({
        content: "You can't guard a bot!\nhttps://tenor.com/yYlL.gif",
        ephemeral: false,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.reply({
        content: `${targetedUser} is dead. Focus on guarding the living.`,
        ephemeral: false,
      });
      return;
    }

    const dbTargetedUser = await findUser(
      targetedUser.id,
      interaction.guild.id
    );

    if (
      dbTargetedUser.character === characters.MASON &&
      !dbUser.onMasonChannel
    ) {
      await updateUser(interaction.user.id, interaction.guild.id, {
        onMasonChannel: true,
      });
      giveMasonChannelPermissions(interaction, interaction.user);
    }

    await updateUser(interaction.user.id, interaction.guild.id, {
      guard: false,
      guarded_user_id: targetedUser.id,
    });

    await interaction.reply(
      message ? message : `You have chosen to guard ${targetedUser}.`
    );
  },
};
