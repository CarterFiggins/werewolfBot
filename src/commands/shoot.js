const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames, characters } = require("../util/commandHelpers");
const { channelNames } = require("../util/channelHelpers");
const { roleNames } = require("../util/rolesHelpers");
const { findGame, findUser, updateUser } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SHOOT)
    .setDescription("shoots another player")
    .setDefaultPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to shoot")
        .setRequired(true)
    ),
  async execute(interaction) {
    const targetedUser = await interaction.options.getUser("target");
    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);
    const mapRoles = targetedMember.roles.cache;
    const dbUser = await findUser(targetedUser.id, interaction.guild.id);
    const hunterUser = await findUser(
      interaction.user.id,
      interaction.guild.id
    );
    const roles = mapRoles.map((role) => {
      return role.name;
    });

    if (!hunterUser.can_shoot) {
      await interaction.reply({
        content: "You can only shoot when you are dying",
        ephemeral: true,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.reply({
        content: "https://tenor.com/67jg.gif",
        ephemeral: true,
      });
      return;
    }
    if (!roles.includes(roleNames.ALIVE)) {
      await interaction.reply({
        content: "Don't shoot dead people",
        ephemeral: true,
      });
      return;
    }
    if (dbUser.user_id === interaction.user.id) {
      await interaction.reply({
        content: `Can't shoot yourself`,
        ephemeral: true,
      });
      return;
    }

    // TODO: make into function so bot can kill if hunter forgets.

    await updateUser(interaction.user.id, interaction.guild.id, {
      can_shoot: false,
    });

    // KILL TARGET USER
  },
};
