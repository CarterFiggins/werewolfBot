module.exports = {
  async buttonResponse(interaction) {
    const button = interaction.client.buttons.get(interaction.customId)
    if (!button) return;

    console.log(
      `${interaction?.user?.tag} in guild ${interaction?.guild?.name}, channel #${interaction?.channel?.name} triggered button ${interaction?.customId}`
    );
    try {
      button.execute(interaction)
    } catch (error) {
      console.log("ERROR: in buttons")
      console.error(error)
    }
  },
};