const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.INFO)
    .setDescription("Get info about a user or a server!")
    .addSubcommand((subcommand) =>
      subcommand.setName("user").setDescription("Info about a user")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("server").setDescription("Info about the server")
    ),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "user") {
      await interaction.reply(
        `Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`
      );
    }
    if (interaction.options.getSubcommand() === "server") {
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
      await interaction.reply(
        `Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`
      );
    }
  },
};
