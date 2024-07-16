const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { findUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { isPlaying } = require("../util/rolesHelpers");

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
    if (isPlaying(interaction.member)) {
      await interaction.reply({
        content: 'When the game starts I will let you know who you are.',
        ephemeral: true,
      });
      return;
    }
    if (dbUser.is_dead) {
      const vampire = ""
      if (dbUser.is_vampire) {
        vampire = "vampire "
      }
      await interaction.reply({
        content: `Your WERE the ${vampire}${dbUser.character}, but now you're dead lol`,
        ephemeral: true,
      });
      return;
    }

    const powerUps = _.map(dbUser.power_ups, (active, name) => {
      return `${name}: ${active}`
    })

    let powerMessage = ""
    if (!_.isEmpty(powerUps)) {
      powerMessage = `\nCurrent Powers\n${powerUps.join("\n")}`
    }

    let vampire = ""
    if (dbUser.is_vampire) {
      vampire = "vampire "
    }

    await interaction.reply({
      content: `Your character is: ${vampire}${dbUser.assigned_identity}${powerMessage}`,
      ephemeral: true,
    });
  },
};
