const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findUser, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { PowerUpNames } = require("../util/powerUpHelpers");
const { organizeChannels } = require("../util/channelHelpers");


module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.PREDATOR_VISION)
    .setDescription("Power up command: find out players character")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to check")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) || !dbUser?.power_ups[PowerUpNames.PREDATOR_VISION],
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
    const targetDbUser = await findUser(targetedUser.id, interaction.guild.id);

    if (targetedUser.bot || targetedTwoUser.bot) {
      await interaction.reply({
        content: "Can't select a bot. Try again",
        ephemeral: true,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.reply({
        content: `${targetedMember} is already dead and can't be chosen. Try again.`,
        ephemeral: true,
      });
      return;
    }
    if (targetedUser.id === interaction.user.id) {
      await interaction.reply({
        content: `You have chosen yourself... you can use \`/who_am_i\` to find out your own character. https://tenor.com/8Ono.gif`,
        ephemeral: true,
      });
      return;
    }

    const playersCharacter = targetDbUser.is_vampire ? `vampire ${targetDbUser.character}` : targetDbUser.character

    await interaction.reply({
      content: `Your predatory senses keenly focus on ${targetedMember}. Through the haze of uncertainty, the truth emerges: ${targetedMember} is a ${playersCharacter}`,
      ephemeral: true,
    });

    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);
    await organizedChannels.afterLife.send(
      `${interaction.member} used predator vision on ${targetedMember} and saw they are the ${playersCharacter}`
    );
    
    dbUser.power_ups[PowerUpNames.PREDATOR_VISION] = false
    await updateUser(dbUser.user_id, interaction.guild.id, {
      power_ups: dbUser.power_ups,
    });
  }
}

