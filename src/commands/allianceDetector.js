const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { characters, teams } = require("../util/characterHelpers/characterUtil")
const { isAlive } = require("../util/rolesHelpers");
const { findUser, updateUser, findGame } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { PowerUpNames, usePowerUp} = require("../util/powerUpHelpers");
const { organizeChannels } = require("../util/channelHelpers");


module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.ALLIANCE_DETECTOR)
    .setDescription("Power up command: find out if players are on same team or not")
    .addUserOption((option) =>
      option
        .setName("target1")
        .setDescription("name of player to check")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("target2")
        .setDescription("name of second player to check")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) || !dbUser?.power_ups[PowerUpNames.ALLIANCE_DETECTOR],
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }
    const game = await findGame(interaction.guild.id);
    const targetedOneUser = await interaction.options.getUser("target1");
    const targetedTwoUser = await interaction.options.getUser("target2");
    const targetedOneMember = interaction.guild.members.cache.get(targetedOneUser.id);
    const targetedTwoMember = interaction.guild.members.cache.get(targetedTwoUser.id);
    const targetOneDbUser = await findUser(targetedOneUser.id, interaction.guild.id);
    const targetTwoDbUser = await findUser(targetedTwoUser.id, interaction.guild.id);

    if (game.first_night) {
      await interaction.reply({
        content:
          "It is the first night. Try again tomorrow",
        ephemeral: true,
      });
      return;
    }
    if (targetedOneUser.bot || targetedTwoUser.bot) {
      await interaction.reply({
        content: "Can't select a bot. Try again",
        ephemeral: true,
      });
      return;
    }
    if (!isAlive(targetedOneMember)) {
      await interaction.reply({
        content: `${targetedOneMember} is already dead and can't be chosen. Try again.`,
        ephemeral: true,
      });
      return;
    }
    if (!isAlive(targetedTwoMember)) {
      await interaction.reply({
        content: `${targetedTwoMember} is already dead and can't be chosen. Try again.`,
        ephemeral: true,
      });
      return;
    }
    if (targetedOneUser.id === targetedTwoUser.id) {
      await interaction.reply({
        content: "hmmm that is the same person! https://tenor.com/G8M4.gif",
        ephemeral: true,
      });
      return;
    }
    if (targetedOneUser.id === interaction.user.id || targetedTwoUser.id === interaction.user.id) {
      await interaction.reply({
        content: "# You thought you could trick me! You can't pick yourself. Try again! https://tenor.com/bL0SD.gif",
        ephemeral: true,
      });
      return;
    }

    const sameTeam = findCharactersTeam(targetOneDbUser) === findCharactersTeam(targetTwoDbUser)

    let message = `are on different teams!`
    if (sameTeam) {
      message = `are on the same team!`
    }
    await interaction.reply({
      content: `${targetedOneMember} and ${targetedTwoMember} ${message}`,
      ephemeral: true,
    });

    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);
    await organizedChannels.afterLife.send(
      `${interaction.member} used Alliance Detector on ${targetedOneMember} and ${targetedTwoMember}. They ${message}`
    );
    await usePowerUp(dbUser, interaction, PowerUpNames.ALLIANCE_DETECTOR);
  }
}

function findCharactersTeam(user) {
  if (user.is_vampire) {
    return teams.VAMPIRE
  }
  if (user.character === characters.CHAOS_DEMON) {
    return teams.CHAOS
  }
  if ([characters.WEREWOLF, characters.WITCH].includes(user.character)) {
    return teams.WEREWOLF
  }
  return teams.VILLAGER
}

