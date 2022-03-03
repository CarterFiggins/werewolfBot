const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  commandNames,
  gameCommandPermissions,
} = require("../util/commandHelpers");
const { findUsersWithIds } = require("../werewolf_db");
const { getAliveUsersIds } = require("../util/userHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.PERMISSION_RESET)
    .setDescription("Resets the alive player permissions"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const aliveUsersId = await getAliveUsersIds(interaction);

    const cursor = await findUsersWithIds(interaction.guild.id, aliveUsersId);
    const dbUsers = await cursor.toArray();

    await gameCommandPermissions(interaction, dbUsers, true);

    await interaction.editReply("permissions reset");
  },
};
