const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil")
const { channelNames } = require("../util/channelHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findGame, findUser, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.GUARD)
    .setDescription("BODYGUARD COMMAND: guard a player for the night")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to guard")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) ||
        dbUser.character !== characters.BODYGUARD,
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
    const guardUser = await findUser(interaction.user.id, interaction.guild.id);

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
    if (targetDbUser.character === characters.BODYGUARD && targetDbUser.user_id !== interaction.user.id) {
      await interaction.reply({
        content: `Nice try, but you can't guard another bodyguard. Turns out, ${targetedUser} is pretty stubborn and won't let you play hero on their turf.`,
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
    if (guardUser.is_muted) {
      await interaction.reply({
        content: `${targetedUser} is safely locked away in the Granny's house. You don't want to go there! try again.`,
        ephemeral: false,
      });
      return;
    }

    await updateUser(interaction.user.id, interaction.guild.id, {
      guarded_user_id: targetedUser.id,
    });

    await interaction.reply(`You are going to guard ${targetedUser}.`);
  },
};
