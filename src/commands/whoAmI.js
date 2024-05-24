const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { findUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.WHO_AM_I)
    .setDescription(
      "Shows you your character in the game"
    ),
  async execute(interaction) {
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const dbUser = await findUser(interaction.user.id, interaction.guild.id);

    if (!dbUser) {
      await interaction.reply({
        content: 'I wish I knew! Try joining a game using `/playing` to get a character.',
        ephemeral: true,
      });
      return;
    }
    await interaction.reply({
      content: `Your character is: ${dbUser.assigned_identity}`,
      ephemeral: true,
    });
  },
};