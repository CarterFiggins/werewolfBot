const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.GIF)
    .setDescription("Sends a random gif!")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("The gif category")
        .setRequired(true)
        .addChoice("fire", "fire")
        .addChoice("sad", "sad")
        .addChoice("death", "death")
    ),
  async execute(interaction) {
    const category = interaction.options.getString("category");
    if (category === "fire") {
      await interaction.reply(
        "https://tenor.com/view/elmo-fire-burning-gif-8869638"
      );
    } else if (category === "sad") {
      await interaction.reply(
        "https://tenor.com/view/the-office-crying-michael-scott-sad-upset-gif-9816214"
      );
    } else if (category === "death") {
      await interaction.reply(
        "https://tenor.com/view/lawnmower-nailed-it-running-over-wtf-getting-run-over-gif-5473018"
      );
    }
  },
};
