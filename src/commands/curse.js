const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil")
const { channelNames, getRandomBotGif } = require("../util/channelHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findGame, findUser, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.CURSE)
    .setDescription("WITCH COMMAND: Curse a player")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to curse")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) || dbUser.character !== characters.WITCH,
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    if (channel.name !== channelNames.WITCH) {
      await interaction.reply({
        content: "Your dark magic only works in the witch channel",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: false });

    const targetedUser = await interaction.options.getUser("target");
    const game = await findGame(interaction.guild.id);
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);
    const targetDbUser = await findUser(targetedUser.id, interaction.guild.id);

    if (game.is_day) {
      await interaction.editReply({
        content:
          "It is day time. Your dark magic works at night.\nhttps://tenor.com/bJMLr.gif",
        ephemeral: false,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.editReply({
        content: `You can't curse me!\n${getRandomBotGif()}`,
        ephemeral: false,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.editReply({
        content: `${targetedUser} is dead. This curse doesn't work on dead people. Try again.\nhttps://tenor.com/bcD0a.gif`,
        ephemeral: false,
      });
      return;
    }
    if (
      targetDbUser.user_id === interaction.user.id ||
      targetDbUser.character === characters.WITCH
    ) {
      await interaction.editReply({
        content: `Can't curse a witch. Try again.\nhttps://tenor.com/w80x.gif`,
        ephemeral: false,
      });
      return;
    }
    if (targetDbUser.is_cursed) {
      await interaction.editReply({
        content: `This player is already cursed\nhttps://tenor.com/bgyEU.gif`,
        ephemeral: false,
      });
      return;
    }

    await updateUser(interaction.user.id, interaction.guild.id, {
      target_cursed_user_id: targetedUser.id,
    });

    await interaction.editReply(`You are going to curse ${targetedUser}`);
  },
};
