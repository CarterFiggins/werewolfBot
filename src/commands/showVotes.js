const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { getCountedVotes } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SHOW_VOTES)
    .setDescription("Shows all votes for users"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const cursor = await getCountedVotes(interaction.guild.id);
    const allVotes = await cursor.toArray();
    if (_.isEmpty(allVotes)) {
      await interaction.editReply({
        content: "There are no votes to be counted",
        ephemeral: false,
      });
      return;
    }

    let message = "";

    await Promise.all(
      _.map(allVotes, async (vote) => {
        const member = await interaction.guild.members.fetch(
          vote._id.voted_user_id
        );
        message += `${member}: ${vote.count} votes\n`;
      })
    );

    await interaction.editReply({
      content: `Current Votes\n${message}`,
      ephemeral: false,
    });
  },
};
