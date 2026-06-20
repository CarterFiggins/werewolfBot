const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { getRandomGif } = require("../util/botMessages/randomGif");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.GIF)
    .setDescription("Sends a random gif!")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("The gif category")
        .setRequired(true)
    ),
  async execute(interaction) {
    const category = interaction.options.getString("category");
    const gif = await getRandomGif(category);

    if (!gif) {
      await interaction.reply({ content: "No gif found for that category.", ephemeral: true });
      return;
    }

    await interaction.reply(gif);
  },
};
