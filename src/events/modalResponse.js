module.exports = {
  async modalResponse(interaction) {
    let customId = interaction.customId

    const modal = interaction.client.modals.get(customId)
    if (!modal) return;

    console.log(
      `${new Date().toISOString()}: ${interaction?.user?.tag} in guild ${interaction?.guild?.name}, channel #${interaction?.channel?.name} triggered modal ${interaction?.customId}`
    );
    try {
      modal.sendResponse(interaction)
    } catch (error) {
      console.log("ERROR: in modals")
      console.error(error)
    }
  },
};