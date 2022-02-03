const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { getCountedVotes } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SHOW_VOTES)
    .setDescription("Shows all votes for users"),
  async execute(interaction) {
    const cursor = await getCountedVotes(interaction.guild.id);
    const allVotes = await cursor.toArray();
    if (_.isEmpty(allVotes)) {
      await interaction.reply({
        content: "There are no votes to be counted",
        ephemeral: true,
      });
      return;
    }

    let message = "";

    _.forEach(allVotes, (vote) => {
      const member = interaction.guild.members.cache.get(
        vote._id.voted_user_id
      );
      message += `${member}: ${vote.count} votes\n`;
    });

    await interaction.reply({
      content: `Current Votes\n${message}`,
      ephemeral: false,
    });
  },
};
