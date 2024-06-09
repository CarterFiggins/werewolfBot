const { SlashCommandBuilder } = require("@discordjs/builders");
const { getRandomBotGif } = require("../util/channelHelpers");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil");
const { permissionCheck } = require("../util/permissionCheck");
const { isAlive } = require("../util/rolesHelpers");
const { updateUser, findUser, findGame } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.CHAOS_TARGET)
    .setDescription("CHAOS DEMON COMMAND: Marks a player for the chaos demon to try and get hanged")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to target")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) ||
        dbUser.character !== characters.CHAOS_DEMON,
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }
    const game = await findGame(interaction.guild.id);

    if (!game.first_night) {
      const preTargetedUser = interaction.guild.members.cache.get(dbUser.chaos_target_user_id)
      await interaction.reply({
        content: `You are targeting ${preTargetedUser}. Try and convince the villagers to hang ${preTargetedUser}`,
        ephemeral: true,
      });
      return;
    }

    const targetedUser = await interaction.options.getUser("target");
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);

    if (targetedUser.bot) {
      await interaction.reply({
        content: `You can't target me!\n${getRandomBotGif()}`,
        ephemeral: true,
      });
      return;
    }
    if (targetedUser.id === interaction.user.id) {
      await interaction.reply({
        content: `Can't pick yourself. try again`,
        ephemeral: true,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.reply({
        content: `${targetedUser} is dead. You don't what to target that.`,
        ephemeral: true,
      });
      return;
    }

    await updateUser(interaction.user.id, interaction.guild.id, {
      chaos_target_user_id: targetedUser.id,
    });

    await interaction.reply({
      content: `You are going to target ${targetedUser}. After the first night is over it will be locked in.`,
      ephemeral: true,
    });
  },
};
