const _ = require("lodash");
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
      await interaction.reply(getRandomGif(fire));
    } else if (category === "sad") {
      await interaction.reply(getRandomGif(sad));
    } else if (category === "death") {
      await interaction.reply(getRandomGif(death));
    }
  },
};

function getRandomGif(gifArray) {
  return _.head(_.shuffle(gifArray));
}

const sad = [
  "https://tenor.com/tFAk.gif",
  "https://tenor.com/Kdgg.gif",
  "https://tenor.com/view/the-office-crying-michael-scott-sad-upset-gif-9816214",
  "https://tenor.com/MUNo.gif",
  "https://tenor.com/4rM4.gif",
  "https://tenor.com/osCT.gif",
];

const fire = [
  "https://tenor.com/blN7D.gif",
  "https://tenor.com/6rcS.gif",
  "https://tenor.com/view/elmo-fire-burning-gif-8869638",
  "https://tenor.com/bd8pO.gif",
  "https://tenor.com/wqP1.gif",
  "https://tenor.com/r4Ka.gif",
];

const death = [
  "https://tenor.com/view/lawnmower-nailed-it-running-over-wtf-getting-run-over-gif-5473018",
  "https://tenor.com/bkhTF.gif",
  "https://tenor.com/TVam.gif",
  "https://tenor.com/wSwM.gif",
  "https://tenor.com/Xg6Z.gif",
  "https://tenor.com/Icnq.gif",
];
