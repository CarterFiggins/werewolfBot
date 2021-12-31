const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("vote for a user")
    .addUserOption((option) =>
      option
        .setName("voted")
        .setDescription("name of player to vote off")
        .setRequired(true)
    ),
  async execute(interaction) {
    const votedUser = interaction.options.getUser("voted");
    // TODO: submit who the user has voted for
    await interaction.reply(
      `${interaction.user.username} has voted for ${votedUser.username}`
    );
  },
};
