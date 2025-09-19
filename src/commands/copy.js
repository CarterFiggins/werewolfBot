const { SlashCommandBuilder } = require("@discordjs/builders");
const { getRandomBotGif } = require("../util/channelHelpers");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil");
const { permissionCheck } = require("../util/permissionCheck");
const { isAlive } = require("../util/rolesHelpers");
const { updateUser, findUser } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.COPY)
    .setDescription("DOPPELGANGER COMMAND: Copies another players character")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to copy")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) ||
        dbUser.character !== characters.DOPPELGANGER,
    });

    if (deniedMessage) {
      await interaction.editReply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const targetedUser = await interaction.options.getUser("target");
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);

    if (targetedUser.bot) {
      await interaction.editReply({
        content: `You can't copy me!\n${getRandomBotGif()}`,
        ephemeral: true,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.editReply({
        content: `${targetedUser} is dead. You don't what to copy that.`,
        ephemeral: true,
      });
      return;
    }

    await updateUser(interaction.user.id, interaction.guild.id, {
      copy_user_id: targetedUser.id,
    });

    await interaction.editReply({
      content: `You are going to copy ${targetedUser}.`,
      ephemeral: true,
    });
  },
};
