const { SlashCommandBuilder } = require("@discordjs/builders");
const { removeAllGameChannels } = require("../util/gameHelpers");
const { deleteAllUsers } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder().setName("end").setDescription("end the game"),
  async execute(interaction) {
    // Delete users from db
    deleteAllUsers();
    // remove channels
    const currentChannels = await interaction.guild.channels.fetch();
    removeAllGameChannels(currentChannels);
    await interaction.reply({ content: "Game Ended", ephemeral: true });
  },
};
