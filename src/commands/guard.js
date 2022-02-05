const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { channelNames } = require("../util/channelHelpers");
const { roleNames } = require("../util/rolesHelpers");
const {
  findGame,
  findUser,
  updateUser,
  updateGame,
} = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.GUARD)
    .setDescription("guard a player for the night")
    .setDefaultPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to guard")
        .setRequired(true)
    ),
  async execute(interaction) {
    const targetedUser = await interaction.options.getUser("target");
    const game = await findGame(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);
    const mapRoles = targetedMember.roles.cache;
    const guardUser = await findUser(interaction.user.id, interaction.guild.id);
    const roles = mapRoles.map((role) => {
      return role.name;
    });

    let message;

    // TODO: add more random gifs
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
    if (!guardUser.guard) {
      await interaction.reply({
        content:
          "You are tired and can only guard one person. Try again next night.",
        ephemeral: false,
      });
      return;
    }
    if (guardUser.last_user_guard_id == targetedUser.id) {
      await interaction.reply({
        content: `You guarded ${targetedUser} last night and can not protect someone twice in a row.`,
        ephemeral: false,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.reply({
        content: "https://tenor.com/yYlL.gif",
        ephemeral: false,
      });
      return;
    }
    if (!roles.includes(roleNames.ALIVE)) {
      await interaction.reply({
        content: "This Person is dead. Focus on guarding the living.",
        ephemeral: false,
      });
      return;
    }

    await updateGame(interaction.guild.id, {
      user_guarded_id: targetedUser.id,
    });
    await updateUser(interaction.user.id, interaction.guild.id, {
      guard: false,
      last_user_guard_id: targetedUser.id,
    });

    await interaction.reply(
      message ? message : `You have chosen to guard ${targetedUser}.`
    );
  },
};
