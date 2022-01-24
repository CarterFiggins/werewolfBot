const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove_role")
    .setDescription("remove a role from a user")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of user to remove a role from")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("role to remove from user")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("target");
    const role = interaction.options.getRole("role");

    const member = interaction.guild.members.cache.get(user.id);
    member.roles.remove(role);

    await interaction.reply({
      content: `${role} has been removed from ${user.username}`,
      ephemeral: true,
    });
  },
};
