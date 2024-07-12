module.exports = {
  async commandResponse(interaction) {
    if (!interaction.channel.type) {
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
    try {
      await command.execute(interaction);
    } catch (error) {
      console.log("ERROR: executing a command");
      console.error(error)
      try {
        if (interaction.replied || interaction.deferred) {
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
      } catch (error) {
        console.log("ERROR: while replying");
        console.error(error)
      }
    }
  },
};
