const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames, characters } = require("../util/commandHelpers");
const { channelNames, getRandomBotGif } = require("../util/channelHelpers");
const { roleNames } = require("../util/rolesHelpers");
const { findGame, findUser, updateUser } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.CURSE)
    .setDescription("Curse a player")
    .setDefaultPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to curse")
        .setRequired(true)
    ),
  async execute(interaction) {
    const targetedUser = await interaction.options.getUser("target");
    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);
    const targetDbUser = await findUser(targetedUser.id, interaction.guild.id);
    const mapRoles = targetedMember.roles.cache;
    const roles = mapRoles.map((role) => {
      return role.name;
    });

    if (channel.name !== channelNames.WITCH) {
      await interaction.reply({
        content: "Your dark magic only works in the witch channel",
        ephemeral: true,
      });
      return;
    }
    if (game.is_day) {
      await interaction.reply({
        content:
          "It is day time. Your dark magic works at night.\nhttps://tenor.com/bJMLr.gif",
        ephemeral: false,
      });
      return;
    }
    // if (targetedUser.bot) {
    //   await interaction.reply({
    //     content: `You can't curse me!\n${getRandomBotGif()}`,
    //     ephemeral: false,
    //   });
    //   return;
    // }
    if (!roles.includes(roleNames.ALIVE)) {
      await interaction.reply({
        content:
          "Curses don't work on dead people. Try again.\nhttps://tenor.com/bcD0a.gif",
        ephemeral: false,
      });
      return;
    }
    if (
      targetDbUser.user_id === interaction.user.id ||
      targetDbUser.character === characters.WITCH
    ) {
      await interaction.reply({
        content: `Can't curse a witch. Try again.\nhttps://tenor.com/w80x.gif`,
        ephemeral: false,
      });
      return;
    }
    if (targetDbUser.is_cursed) {
      await interaction.reply({
        content: `This player is already cursed\nhttps://tenor.com/bgyEU.gif`,
        ephemeral: false,
      });
      return;
    }

    await updateUser(interaction.user.id, interaction.guild.id, {
      target_cursed_user_id: targetedUser.id,
    });

    await interaction.reply(`You are going to curse ${targetedUser}`);
  },
};
