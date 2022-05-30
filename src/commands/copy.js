const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames, characters } = require("../util/commandHelpers");
const { updateUser } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.COPY)
    .setDescription("Copies another players character")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to copy")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) ||
        dbUser.character !== characters.DOPPELGANGER,
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const targetedUser = await interaction.options.getUser("target");
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);

    if (targetedUser.bot) {
      await interaction.reply({
        content: "You can't copy me!\nhttps://tenor.com/yYlL.gif",
        ephemeral: true,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.reply({
        content: `${targetedUser} is dead. You don't what to copy that.`,
        ephemeral: true,
      });
      return;
    }

    await updateUser(interaction.user.id, interaction.guild.id, {
      copy_user_id: targetedUser.id,
    });

    await interaction.reply({
      content: `You are going to copy ${targetedUser}.`,
      ephemeral: true,
    });
  },
};
