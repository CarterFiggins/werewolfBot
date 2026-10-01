const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findUser, findGame } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { PowerUpNames, usePowerUp } = require("../util/powerUpHelpers");
const { organizeChannels } = require("../util/channelHelpers");
const { getPlayersCharacter } = require("../util/userHelpers");
const { fetchMember } = require("../util/discordHelpers");

const targetOptions = ["target1", "target2", "target3"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.RUMOR)
    .setDescription("Power up command: learn the role of one of three players, but not which one")
    .addUserOption((option) =>
      option
        .setName("target1")
        .setDescription("first player in the rumor")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("target2")
        .setDescription("second player in the rumor")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("target3")
        .setDescription("third player in the rumor")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) || !dbUser?.power_ups[PowerUpNames.RUMOR],
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const guildId = interaction.guild.id;
    const game = await findGame(guildId);
    const targetedUsers = _.map(targetOptions, (name) => interaction.options.getUser(name));

    if (game.first_night) {
      await interaction.reply({
        content: "It is the first night. Try again tomorrow",
        ephemeral: true,
      });
      return;
    }
    if (_.uniqBy(targetedUsers, "id").length !== targetedUsers.length) {
      await interaction.reply({
        content: "You need to pick three different players. Try again.",
        ephemeral: true,
      });
      return;
    }
    if (_.some(targetedUsers, (user) => user.bot)) {
      await interaction.reply({
        content: "Can't select a bot. Try again",
        ephemeral: true,
      });
      return;
    }
    if (_.some(targetedUsers, (user) => user.id === interaction.user.id)) {
      await interaction.reply({
        content: "You can't start a rumor about yourself. Pick three other players.",
        ephemeral: true,
      });
      return;
    }

    const targetedMembers = await Promise.all(
      _.map(targetedUsers, (user) => fetchMember(interaction, user.id))
    );

    if (_.some(targetedMembers, (member) => !member)) {
      await interaction.reply({
        content: "Could not find one of those players in the server. Try again.",
        ephemeral: true,
      });
      return;
    }
    const deadMember = _.find(targetedMembers, (member) => !isAlive(member));
    if (deadMember) {
      await interaction.reply({
        content: `${deadMember} is already dead and can't be chosen. Try again.`,
        ephemeral: true,
      });
      return;
    }

    // The rumor is about one random player, but we don't say which one.
    const rumoredUser = _.sample(targetedUsers);
    const rumoredDbUser = await findUser(rumoredUser.id, guildId);
    // Leave out the mayor tag. Everyone knows who the mayor is, so it would give away which player it is.
    const rumoredCharacter = getPlayersCharacter({ ...rumoredDbUser, is_mayor: false });
    const rumoredMember = _.find(targetedMembers, (member) => member.id === rumoredUser.id);
    const playersList = targetedMembers.join(", ");

    await interaction.reply({
      content: `🗣️ Word around the village is that one of ${playersList} is the **${rumoredCharacter}**.`,
      ephemeral: true,
    });

    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);
    await organizedChannels.afterLife.send(
      `🗣️ ${interaction.member} used a rumor on ${playersList} and heard one of them is the ${rumoredCharacter}. (It was ${rumoredMember})`
    );
    await usePowerUp(dbUser, interaction, PowerUpNames.RUMOR);
  }
}
