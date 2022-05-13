module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return;
    console.log(
      `${interaction.user.tag} in guild ${interaction.guild?.name}, channel #${interaction.channel.name} triggered command ${interaction.commandName}`
    );

    try {
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
