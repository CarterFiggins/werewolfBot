const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add_role")
    .setDescription("give a role to a user")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of user to add a role to")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("role to add to user")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("target");
    const role = interaction.options.getRole("role");

    const member = interaction.guild.members.cache.get(user.id);
    member.roles.add(role);

    await interaction.reply({
      content: `${user.username} now has the role ${role}`,
      ephemeral: true,
    });
  },
};
