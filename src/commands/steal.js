const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findUser, findGame } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { PowerUpNames, usePowerUp, grantPowerUp } = require("../util/powerUpHelpers");
const { sendMemberMessage } = require("../util/botMessages/sendMemberMessages");
const { organizeChannels } = require("../util/channelHelpers");
const { getRandomGif } = require("../util/botMessages/randomGif");


module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.STEAL)
    .setDescription("Power up command: Steal a power up from another player")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to steal from")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) || (!dbUser?.power_ups[PowerUpNames.STEAL]),
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const game = await findGame(interaction.guild.id);
    const targetedUser = await interaction.options.getUser("target");
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);
    const targetDbUser = await findUser(targetedUser.id, interaction.guild.id);

    if (game.first_night) {
      await interaction.reply({
        content:
          "It is the first night. Try again tomorrow",
        ephemeral: true,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.reply({
        content: `You have been caught STEALING! ${_.sample(["don't touch me", "caught", "stop it"])}`,
        ephemeral: true,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.reply({
        content: `${targetedUser} is already dead! try again.\nhttps://tenor.com/bKuUS.gif`,
        ephemeral: true,
      });
      return;
    }
    if (targetDbUser.user_id === interaction.user.id) {
      await interaction.reply({
        content: `Can't steal from yourself. Try again!`,
        ephemeral: true,
      });
      return;
    }
    if (targetDbUser.is_muted) {
      await interaction.reply({
        content: `${targetedUser} is in the Granny's house and can not steal from them. Try again!`,
        ephemeral: true,
      });
      return;
    }

    const currentTargetPowers = _.reduce(targetDbUser.power_ups, (powers, amount, name) => {
      if (amount > 0 && name !== PowerUpNames.STEAL) {
        powers.push(name)
      }
      return powers
    }, [])

    if (_.isEmpty(currentTargetPowers)) {
      await interaction.reply({
        content: `You tried to steal from ${targetedUser} but they had no powers for you to take.`,
        ephemeral: true,
      });
      await usePowerUp(dbUser, interaction, PowerUpNames.STEAL)
      return;
    }

    const stolenPowerName = _.sample(currentTargetPowers)
    await usePowerUp(dbUser, interaction, PowerUpNames.STEAL)
    await grantPowerUp(dbUser, interaction, stolenPowerName)
    await usePowerUp(targetDbUser, interaction, stolenPowerName)
    const displayStolenGif = await getRandomGif(_.sample(["stolen", "robbed", "gone"]));
    await sendMemberMessage(targetedMember, `The power up ${stolenPowerName} was stolen from you! ${displayStolenGif}`)

    await interaction.reply({
      content: `You stole from ${targetedUser}! You have stolen the power ${stolenPowerName}.`,
      ephemeral: true,
    });

    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);
    await organizedChannels.afterLife.send(
      `${interaction.member} has stolen ${stolenPowerName} from ${targetedUser}! ${displayStolenGif}`
    );
  }
}
