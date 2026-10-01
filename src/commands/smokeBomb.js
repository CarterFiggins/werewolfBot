const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findUser, findGame, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { PowerUpNames, usePowerUp } = require("../util/powerUpHelpers");
const { isSmokeBombed } = require("../util/powerUp/smokeBombHelper");
const { organizeChannels } = require("../util/channelHelpers");


module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SMOKE_BOMB)
    .setDescription("Power up command: vanish for the night. Use at night, or during the day to set it up for tonight"),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) || (!dbUser?.power_ups[PowerUpNames.SMOKE_BOMB]),
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const game = await findGame(interaction.guild.id);

    if (game.first_night) {
      await interaction.reply({
        content: "It is the first night. Try again tomorrow",
        ephemeral: true,
      });
      return;
    }
    if (isSmokeBombed(dbUser)) {
      await interaction.reply({
        content: "Your smoke bomb is already active for tonight",
        ephemeral: true,
      });
      return;
    }
    if (dbUser.smoke_bomb_armed) {
      await interaction.reply({
        content: "Your smoke bomb is already set up and will go off when night falls",
        ephemeral: true,
      });
      return;
    }

    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);

    // During the day the smoke bomb is set up and goes off when night falls.
    if (game.is_day) {
      await updateUser(dbUser.user_id, interaction.guild.id, {
        smoke_bomb_armed: true,
      });
      await usePowerUp(dbUser, interaction, PowerUpNames.SMOKE_BOMB);
      await organizedChannels.afterLife.send(
        `💨 ${interaction.member} has set up a smoke bomb that will go off when night falls 💨`
      );
      await interaction.reply({
        content: "💨 Your smoke bomb is set up! It will go off when night falls. From then until morning no character power will work on you, and any gun shot at you will miss.",
        ephemeral: true,
      });
      return;
    }

    await updateUser(dbUser.user_id, interaction.guild.id, {
      smoke_bomb_active: true,
    });
    await usePowerUp(dbUser, interaction, PowerUpNames.SMOKE_BOMB);

    await organizedChannels.afterLife.send(
      `💨 ${interaction.member} has used a smoke bomb and disappeared for the night 💨`
    );

    await interaction.reply({
      content: "💨 You threw your smoke bomb and vanished! Until morning no character power will work on you, and any gun shot at you will miss.",
      ephemeral: true,
    });
  }
}
