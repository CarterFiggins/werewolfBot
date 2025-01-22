module.exports = {
  async selectMenuResponse(interaction) {
    const selectMenu = interaction.client.selectMenus.get(interaction.customId);
    if (!selectMenu) return;
    
    console.log(
      `${new Date().toISOString()}: ${interaction?.user?.tag} in guild ${interaction?.guild?.name}, channel #${interaction?.channel?.name} triggered selectMenu ${interaction?.customId}, values: ${interaction?.values}`
    );
    try {
      await selectMenu.sendResponse(interaction);
    } catch (error) { 
      console.log("ERROR: in selectMenuResponse")
      console.error(error)
    }
  },
};
