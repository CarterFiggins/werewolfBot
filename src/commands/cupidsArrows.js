const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { getRandomSadBotGif } = require("../util/channelHelpers");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil");
const { permissionCheck } = require("../util/permissionCheck");
const { isAlive } = require("../util/rolesHelpers");
const { updateUser, findUser } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.CUPIDS_ARROWS)
    .setDescription("CUPID COMMAND: Cause two players to fall in love")
    .addUserOption((option) =>
      option
        .setName("target1")
        .setDescription("first target to fall in love")
        .setRequired(true)
    )
    .addUserOption((option) =>
        option
          .setName("target2")
          .setDescription("second target to fall in love")
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
        dbUser.character !== characters.CUPID,
    });

    if (deniedMessage) {
      await interaction.editReply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const members = interaction.guild.members.cache

    const targetedOneUser = await interaction.options.getUser("target1");
    const targetedTwoUser = await interaction.options.getUser("target2");
    const targetedOneMember = members.get(targetedOneUser.id);
    const targetedTwoMember = members.get(targetedTwoUser.id);

    if (dbUser.cupid_success_hits) {
      const CoupleMembers = _.map(dbUser.cupid_hit_ids, (id) => {
        return `${members.get(id)}`
      })
      await interaction.editReply({
        content: `${CoupleMembers.join(", ")} are already in love. You are out of arrows`,
        ephemeral: true,
      });
      return;
    }
    if (dbUser.user_id === targetedOneUser.id || dbUser.user_id === targetedTwoUser.id) {
      await interaction.editReply({
        content: `You can not select yourself to fall in love. Try again.`,
        ephemeral: true,
      });
      return;
    }
        if (targetedOneUser.id === targetedTwoUser.id) {
      await interaction.editReply({
        content: `Can't shot both arrows at one person! Try again`,
        ephemeral: true,
      });
      return;
    }
    if (!isAlive(targetedOneMember) || !isAlive(targetedTwoMember)) {
      await interaction.editReply({
        content: `${targetedOneUser} or ${targetedTwoUser} is dead. Please don't do this and try again.`,
        ephemeral: true,
      });
      return;
    }

    await updateUser(interaction.user.id, interaction.guild.id, {
      cupid_hit_ids: [targetedOneUser.id, targetedTwoUser.id],
    });

    await interaction.editReply({
      content: `${targetedOneUser} and ${targetedTwoUser} are going to fall in love!`,
      ephemeral: true,
    });
  },
};
