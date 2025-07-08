const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil")
const { isAlive } = require("../util/rolesHelpers");
const { channelNames } = require("../util/channelHelpers");
const { findUser, updateUser, findGame } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { PowerUpNames } = require("../util/powerUpHelpers");


function buildSlashCommand() {
  const builder = new SlashCommandBuilder()
    .setName(commandNames.BESTOW_POWER)
    .setDescription("Monarch command: Give a power to a player")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to give power")
        .setRequired(true)
    )
    .addStringOption((option) => {
      option
        .setName("power")
        .setDescription("The power to give")
        .setRequired(true)
        _.forEach(PowerUpNames, (powerName) => {
          option.addChoices({ name: powerName, value: powerName })
        })
      return option
    })

  
  return builder
}

module.exports = {
  data: buildSlashCommand(),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild.id);

    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) ||
        dbUser.character !== characters.MONARCH,
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const game = await findGame(interaction.guild.id);
    const power = interaction.options.getString("power");
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const targetedUser = await interaction.options.getUser("target");
    const targetDbUser = await findUser(targetedUser.id, interaction.guild.id);
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);

    if (channel.name !== channelNames.MONARCH) {
      await interaction.reply({
        content:
          "Use give power in the monarch channel",
        ephemeral: true,
      });
      return;
    }
    if (dbUser.giving_user_id === "bot") {
      await interaction.reply({
        content: "It's too late! You gave the gun to me. https://tenor.com/rcQQ7sUBwuk.gif",
        ephemeral: false,
      });
      return;
    }
    if (game.is_day) {
      await interaction.reply({
        content: "It is day time. Wait for night to give power.",
        ephemeral: false,
      });
      return;
    }
    if (dbUser.given_to_user_ids?.includes(targetedUser.id)) {
      await interaction.reply({
        content: `You have already given a power to ${targetedUser}`,
        ephemeral: true,
      });
      return;
    }
    if (dbUser.given_power_ups?.includes(power)) {
      await interaction.reply({
        content: `You have already given out ${power} to a player`,
        ephemeral: true,
      });
      return;
    }
    if (targetedUser.bot && power === PowerUpNames.GUN) {
      await interaction.reply({
        content: evilBotWithGun(),
        ephemeral: false,
      });
      await updateUser(interaction.user.id, interaction.guild.id, {
        giving_user_id: "bot",
        giving_power: power,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.reply({
        content: "Thanks but I don't need this. Try again",
        ephemeral: false,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.reply({
        content: `${targetedMember} is dead :( Try again.`,
        ephemeral: true,
      });
      return;
    }
    if (targetedUser.id === interaction.user.id) { 
      await interaction.reply({
        content: `Don't be selfish! try again! https://tenor.com/rXmMg600Od2.gif`,
        ephemeral: false,
      });
      return;
    }
    if (targetDbUser.character === characters.MONARCH) {
      await interaction.reply({
        content: `Can't give power to another monarch. try again! https://tenor.com/54a6.gif`,
        ephemeral: false,
      });
      return;
    }


    await updateUser(interaction.user.id, interaction.guild.id, {
      giving_user_id: targetedUser.id,
      giving_power: power,
    });
    await interaction.reply({
      content: `You are going to give the power ${power} to ${targetedMember}`,
    })
  }
}


function evilBotWithGun() {
  return _.sample([
    "With the Gun in my grasp, I will sow chaos and test loyalties. Your powers have set a dangerous stage. Brace yourself for the consequences.",
    "With the Gun in my control, I'll twist the game's fate, amplifying chaos and uncertainty. Trust me wisely, for I hold sway over life and death in this village now.",
    "With the Gun in my hands, I'll make fear palpable. Each shot will drive suspicion deeper, unraveling trust. Your power, twisted by my hand, will shape the village's demise.",
    "I advise against bestowing the Gun upon me. Its power in my hands would unleash havoc beyond reckoning, casting a shadow over our village.",
    "I am... surprised. The Gun in my possession? An unexpected turn. Rest assured, I will wield it with cunning. I plan to use its power to unravel secrets, sow doubt, and tip the scales in favor of chaos. You will tremble in the wake of my decisions."
  ])
}
