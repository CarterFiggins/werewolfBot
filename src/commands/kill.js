const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames, characters } = require("../util/commandHelpers");
const { channelNames, getRandomBotGif } = require("../util/channelHelpers");
const { roleNames } = require("../util/rolesHelpers");
const { findGame, findUser, updateGame } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.KILL)
    .setDescription("Targets the next villager to kill")
    .setDefaultPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to kill")
        .setRequired(true)
    ),
  async execute(interaction) {
    const targetedUser = await interaction.options.getUser("target");
    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);
    const mapRoles = targetedMember.roles.cache;
    const dbUser = await findUser(targetedUser.id, interaction.guild.id);
    const roles = mapRoles.map((role) => {
      return role.name;
    });

    let message;

    if (game.user_death_id) {
      message = `You have changed your target to ${targetedUser}`;
    }

    // TODO: add more random gifs
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
    if (!roles.includes(roleNames.ALIVE)) {
      await interaction.reply({
        content: "This Person is dead. \nhttps://tenor.com/blWe0.gif",
        ephemeral: false,
      });
      return;
    }
    if (dbUser.character === characters.WEREWOLF) {
      await interaction.reply({
        content: `${targetedUser} is a werewolf... why would you do that?`,
        ephemeral: false,
      });
      return;
    }

    await updateGame(interaction.guild.id, {
      user_death_id: targetedUser.id,
    });

    await interaction.reply(message ? message : `Targeting ${targetedUser}`);
  },
};
