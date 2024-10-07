const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil")
const { channelNames, getRandomBotGif } = require("../util/channelHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findGame, findUser, updateGame } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.KILL)
    .setDescription("WEREWOLF COMMAND: Targets the next villager to kill")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to kill")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);

    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) ||
        dbUser.character !== characters.WEREWOLF,
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
    const dbTargetUser = await findUser(targetedUser.id, interaction.guild.id);

    let message;

    if (game.user_death_id) {
      message = `You have changed your target to ${targetedUser}\n`;
    }

    if (channel.name !== channelNames.WEREWOLVES) {
      await interaction.reply({
        content:
          "Don't use kill here! Someone might see you! Go the the werewolf channel",
        ephemeral: true,
      });
      return;
    }
    if (game.is_day) {
      await interaction.reply({
        content: "It is day time. Werewolves hunt at night.",
        ephemeral: false,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.reply({
        content: `You can't kill me!\n${getRandomBotGif()}`,
        ephemeral: false,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.reply({
        content: `${targetedUser} is dead. \nhttps://tenor.com/blWe0.gif`,
        ephemeral: false,
      });
      return;
    }
    if (dbTargetUser.character === characters.WEREWOLF) {
      await interaction.reply({
        content: `${targetedUser} is a werewolf... try again?\nhttps://tenor.com/bPmzV.gif`,
        ephemeral: false,
      });
      return;
    }
    if (
      targetedUser.id === game.user_death_id ||
      targetedUser.id === game.second_user_death_id
    ) {
      await interaction.reply({
        content: `Already targeting ${targetedUser}`,
        ephemeral: false,
      });
      return;
    }
    if (dbTargetUser.isMuted) {
      await interaction.reply({
        content: `${targetedUser} is safely locked away in the Granny's house. Try again`,
        ephemeral: false,
      });
      return;
    }

    await updateGame(interaction.guild.id, {
      user_death_id: targetedUser.id,
      second_user_death_id: game.wolf_double_kill ? game.user_death_id : null,
    });
    const secondKill = interaction.guild.members.cache.get(game.user_death_id);

    let secondKillMassage = "";
    if (secondKill && game.wolf_double_kill) {
      secondKillMassage = `and second target is ${secondKill}\n`;
      if (message) {
        message += secondKillMassage;
      }
    }

    await interaction.reply(
      message
        ? message
        : `Targeting ${targetedUser} ${
            game.wolf_double_kill ? "You can target another player" : ""
          }`
    );
  },
};
