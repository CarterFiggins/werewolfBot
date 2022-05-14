const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames, characters } = require("../util/commandHelpers");
const { channelNames } = require("../util/channelHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findGame, findUser, updateUser } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SEE)
    .setDescription("sees the player's character")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to investigate")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild.id);
    const seerOrFool =
      dbUser &&
      (dbUser.character === characters.SEER ||
        dbUser.character === characters.FOOL);
    if (!isAlive(interaction.member) || !seerOrFool) {
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
    const targetDbUser = await findUser(targetedUser.id, interaction.guild.id);
    const seerUser = await findUser(interaction.user.id, interaction.guild.id);

    if (channel.name !== channelNames.SEER) {
      await interaction.reply({
        content: "Your magic only works in the seer channel",
        ephemeral: true,
      });
      return;
    }
    if (!seerUser.see) {
      await interaction.reply({
        content:
          "You are tired. Your gift only works once. Try again next night",
        ephemeral: false,
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
        content: `${targetedUser} is dead. Focus on the living`,
        ephemeral: false,
      });
      return;
    }
    if (targetDbUser.user_id === interaction.user.id) {
      await interaction.reply({
        content: `${targetedUser} is a seer... hmm thats you right? You don't have to investigate to know that! try again.`,
        ephemeral: false,
      });
      return;
    }
    if (
      targetDbUser.character === characters.SEER ||
      targetDbUser.character === characters.FOOL
    ) {
      await interaction.reply({
        content: `${targetedUser} is a **werewolf**..... jk they are a villager in the same channel as you! **try again!**\nhttps://tenor.com/bK8Gm.gif`,
        ephemeral: false,
      });
      return;
    }
    await updateUser(interaction.user.id, interaction.guild.id, {
      see: false,
    });

    let targetedCharacter = "Villager! Nice someone you can trust";
    if (seerUser.character === characters.FOOL) {
      const randomNumber = _.random(1, 3);
      // 33% chance of fool getting a werewolf
      if (randomNumber === 1) {
        targetedCharacter = "Werewolf! watch out for this guy.";
      }
      await interaction.reply(`${targetedUser} is a ${targetedCharacter}`);
    } else {
      if (
        targetDbUser.character === characters.WEREWOLF ||
        targetDbUser.character === characters.LYCAN
      ) {
        targetedCharacter = "Werewolf! watch out for this guy.";
      }

      await interaction.reply(`${targetedUser} is a ${targetedCharacter}`);
    }
  },
};
