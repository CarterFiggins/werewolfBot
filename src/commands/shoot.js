const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil")
const { isAlive } = require("../util/rolesHelpers");
const { findUser, findGame } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { PowerUpNames } = require("../util/powerUpHelpers");
const { channelNames } = require("../util/channelHelpers");
const { gunFire } = require("../util/deathHelper");


module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SHOOT)
    .setDescription("HUNTER COMMAND: shoots another player")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to shoot")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) || (dbUser.character !== characters.HUNTER && !dbUser?.power_ups[PowerUpNames.GUN]),
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }
    const game = await findGame(interaction.guild.id);
    const targetedUser = await interaction.options.getUser("target");
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);
    const targetDbUser = await findUser(targetedUser.id, interaction.guild.id);
    const userWhoShot = await findUser(
      interaction.user.id,
      interaction.guild.id
    );

    if (game.first_night) {
      await interaction.reply({
        content:
          "It is the first night. Try again tomorrow",
        ephemeral: true,
      });
      return;
    }
    if (dbUser.character === characters.HUNTER && !userWhoShot.is_injured && !dbUser?.power_ups[PowerUpNames.GUN]) {
      await interaction.reply({
        content:
          "You can only shoot when you are injured\nhttps://tenor.com/wgj9.gif",
        ephemeral: true,
      });
      return;
    }
    if (channel.name !== channelNames.TOWN_SQUARE) {
      await interaction.reply({
        content:
          "HEY! don't shoot here you can hurt someone! shoot in the town-square. :+1:",
        ephemeral: true,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.reply({
        content: "Silly human.\nhttps://tenor.com/67jg.gif",
        ephemeral: true,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.reply({
        content: `${targetedUser} is already dead. Don't shoot dead people! try again.\nhttps://tenor.com/Jx9w.gif`,
        ephemeral: true,
      });
      return;
    }
    if (targetDbUser.user_id === interaction.user.id) {
      await interaction.reply({
        content: `Can't shoot yourself\nhttps://tenor.com/7Ev1.gif`,
        ephemeral: true,
      });
      return;
    }
    if (targetDbUser.isMuted) {
      await interaction.reply({
        content: `${targetedUser} is safely locked away in the Granny's house. Fun fact: it's made of reinforced metal! This place can stop a bullet, a werewolf, and even Grandma's hard candy collection. Try again`,
        ephemeral: true,
      });
      return;
    }

    await gunFire(interaction, targetDbUser, userWhoShot)
  }
}

