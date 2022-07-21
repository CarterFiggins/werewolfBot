module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      if (!interaction.isCommand()) return;
      if (interaction.channel.type == "DM") {
        await interaction.reply({
          content: "DM commands are turned off",
          ephemeral: true,
        });
        return;
      }

      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) return;
      console.log(
        `${interaction?.user?.tag} in guild ${interaction?.guild?.name}, channel #${interaction?.channel?.name} triggered command ${interaction?.commandName}`
      );

      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied) {
        await interaction.editReply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  },
};
