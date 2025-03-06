module.exports = {
  async buttonResponse(interaction) {
    let customId = interaction.customId
    if (customId.includes("&&")) {
      const [id, data] = customId.split("&&")
      customId = id
      interaction.buttonData = data
    }
    const button = interaction.client.buttons.get(customId)
    if (!button) return;

    console.log(
      `${new Date().toISOString()}: ${interaction?.user?.tag} in guild ${interaction?.guild?.name}, channel #${interaction?.channel?.name} triggered button ${interaction?.customId}`
    );
    try {
      button.execute(interaction)
    } catch (error) {
      console.log("ERROR: in buttons")
      console.error(error)
    }
  },
};