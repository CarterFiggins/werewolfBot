const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.VOTE)
    .setDescription("vote for a user")
    .addUserOption((option) =>
      option
        .setName("voted")
        .setDescription("name of player to vote off")
        .setRequired(true)
    ),
  async execute(interaction) {
    const votedUser = interaction.options.getUser("voted");

    await interaction.reply(`${interaction.user} has voted for ${votedUser}`);
  },
};
