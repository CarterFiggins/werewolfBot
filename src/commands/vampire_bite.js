const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { channelNames, getRandomBotGif } = require("../util/channelHelpers");
const { roleNames } = require("../util/rolesHelpers");
const { findGame, findUser, updateUser } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.VAMPIRE_BITE)
    .setDescription("bite a player")
    .setDefaultPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to bite")
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

    if (channel.name !== channelNames.VAMPIRES) {
      await interaction.reply({
        content:
          "Don't get caught sucking blood in this channel. Use the vampire channel!\nhttps://tenor.com/boEA8.gif",
        ephemeral: true,
      });
      return;
    }
    if (game.is_day) {
      await interaction.reply({
        content:
          "It is day time. You hunt at night.\nhttps://tenor.com/ZtPg.gif",
        ephemeral: false,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.reply({
        content: `You can't bite me!\n${getRandomBotGif()}`,
        ephemeral: false,
      });
      return;
    }
    if (!roles.includes(roleNames.ALIVE)) {
      await interaction.reply({
        content: `Don't bite ${targetedUser}! They are dead. Try again.\nhttps://tenor.com/bcD0a.gif`,
        ephemeral: false,
      });
      return;
    }
    if (
      targetDbUser.user_id === interaction.user.id ||
      targetDbUser.is_vampire
    ) {
      await interaction.reply({
        content: `Can't bite a vampire. Try again.\nhttps://tenor.com/bciFe.gif`,
        ephemeral: false,
      });
      return;
    }

    await updateUser(interaction.user.id, interaction.guild.id, {
      bite_user_id: targetedUser.id,
    });

    await interaction.reply(`You are going to bite ${targetedUser}`);
  },
};
