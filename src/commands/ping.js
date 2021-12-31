const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    // await interaction.deferReply(); // makes a task run longer than 3 seconds
    await interaction.reply("Pong!");
    // sends a followUp message. ephemeral will only allow the user to see it.
    // await interaction.followUp({ content: "Pong again!", ephemeral: true });
  },
};
