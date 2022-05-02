const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { findUsersWithIds } = require("../werewolf_db");
const { getAliveUsersIds } = require("../util/userHelpers");
const { isAdmin } = require("../util/rolesHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.PERMISSION_RESET)
    .setDescription("Resets the alive player permissions"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!isAdmin(interaction.member)) {
      await interaction.editReply({
        content: "You don't have the permissions to reset game permissions",
        ephemeral: true,
      });
      return;
    }

    const aliveUsersId = await getAliveUsersIds(interaction);

    const cursor = await findUsersWithIds(interaction.guild.id, aliveUsersId);
    const dbUsers = await cursor.toArray();

    // ***** Discord js is broken *****
    // await gameCommandPermissions(interaction, dbUsers, true);

    await interaction.editReply("permissions reset");
  },
};
