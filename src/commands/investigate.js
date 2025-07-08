const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil")
const { channelNames } = require("../util/channelHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findGame, findUser, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.INVESTIGATE)
    .setDescription("SEER COMMAND: sees the player's character")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to investigate")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const seerOrFool =
      dbUser &&
      (dbUser.character === characters.SEER ||
        dbUser.character === characters.FOOL);
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () => !isAlive(interaction.member) || !seerOrFool,
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const targetedUser = await interaction.options.getUser("target");
    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);
    const targetDbUser = await findUser(targetedUser.id, interaction.guild.id);

    if (!channel.name.includes(channelNames.SEER)) {
      await interaction.reply({
        content: "Your magic only works in the seer channel",
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
    if (targetedUser.bot) {
      await interaction.reply({
        content: "https://tenor.com/67jg.gif",
        ephemeral: false,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.reply({
        content: `${targetedUser} is dead. Focus on the living and try again`,
        ephemeral: false,
      });
      return;
    }
    if (targetDbUser.user_id === interaction.user.id) {
      await interaction.reply({
        content: `${targetedUser} is a seer... hmm that's you right? You don't have to investigate to know that! Try again.`,
        ephemeral: false,
      });
      return;
    }

    await updateUser(interaction.user.id, interaction.guild.id, {
      investigateUserId: targetedUser.id
    })

    await interaction.reply(`You are going to investigate ${targetedUser}`);
  },
};
