const { SlashCommandBuilder } = require("@discordjs/builders");
const { channelNames } = require("../util/gameHelpers");

module.exports = {
  data: new SlashCommandBuilder().setName("end").setDescription("end the game"),
  async execute(interaction) {
    const currentChannels = await interaction.guild.channels.fetch();
    // remove old channels
    currentChannels.forEach((channel) => {
      switch (channel.name) {
        case channelNames.TOWN_SQUARE:
        case channelNames.WEREWOLVES:
        case channelNames.SEER:
          channel.delete();
      }
    });
    await interaction.reply({ content: "Game Ended", ephemeral: true });
  },
};
