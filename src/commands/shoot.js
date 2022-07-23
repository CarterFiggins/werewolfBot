const _ = require("lodash");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames, characters } = require("../util/commandHelpers");
const { channelNames } = require("../util/channelHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findUser, updateUser } = require("../werewolf_db");
const { organizeRoles } = require("../util/rolesHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { removesDeadPermissions } = require("../util/deathHelper");
const { checkGame } = require("../util/endGameHelper");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SHOOT)
    .setDescription("HUNTER COMMAND: shoots another player")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("name of player to shoot")
        .setRequired(true)
    ),
  async execute(interaction) {
    const dbUser = await findUser(interaction.user.id, interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) || dbUser.character !== characters.HUNTER,
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const targetedUser = await interaction.options.getUser("target");
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    const targetedMember = interaction.guild.members.cache.get(targetedUser.id);
    const targetDbUser = await findUser(targetedUser.id, interaction.guild.id);
    const hunterUser = await findUser(
      interaction.user.id,
      interaction.guild.id
    );

    if (!hunterUser.can_shoot) {
      await interaction.reply({
        content:
          "You can only shoot when you are injured\nhttps://tenor.com/wgj9.gif",
        ephemeral: true,
      });
      return;
    }
    if (channel.name !== channelNames.TOWN_SQUARE) {
      await interaction.reply({
        content:
          "HEY! don't shoot here you can hurt someone! shoot in the town-square. :+1:",
        ephemeral: true,
      });
      return;
    }
    if (targetedUser.bot) {
      await interaction.reply({
        content: "Silly human.\nhttps://tenor.com/67jg.gif",
        ephemeral: false,
      });
      return;
    }
    if (!isAlive(targetedMember)) {
      await interaction.reply({
        content: `${targetedUser} is already dead. Don't shoot dead people! try again.\nhttps://tenor.com/Jx9w.gif`,
        ephemeral: false,
      });
      return;
    }
    if (targetDbUser.user_id === interaction.user.id) {
      await interaction.reply({
        content: `Can't shoot yourself\nhttps://tenor.com/7Ev1.gif`,
        ephemeral: false,
      });
      return;
    }

    await interaction.reply(":dart: PEW PEW :gun:");

    const members = await interaction.guild.members.fetch();
    const deadTargetMember = members.get(targetedUser.id);
    const hunterMember = members.get(interaction.user.id);
    const allRoles = await interaction.guild.roles.fetch();
    const organizedRoles = organizeRoles(allRoles);

    // kill target
    const deadCharacter = await removesDeadPermissions(
      interaction,
      targetDbUser,
      deadTargetMember,
      organizedRoles
    );
    // kill hunter
    await removesDeadPermissions(
      interaction,
      hunterUser,
      hunterMember,
      organizedRoles
    );

    await updateUser(interaction.user.id, interaction.guild.id, {
      can_shoot: false,
    });

    let message = "";

    if (targetDbUser.character === characters.HUNTER) {
      message = `${targetedUser} you have been injured and don't have long to live. Grab you gun and \`/shoot\` someone.`;
    }

    await interaction.editReply(
      `${interaction.user} took aim and shot the ${deadCharacter} named ${targetedUser}\n${message}`
    );

    await checkGame(interaction);
  },
};
