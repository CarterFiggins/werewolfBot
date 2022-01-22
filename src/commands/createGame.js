const { SlashCommandBuilder } = require("@discordjs/builders");
const { getPlayingUsers } = require("../util/gameHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("creates the game"),
  async execute(interaction) {
    const playingUsers = await getPlayingUsers(interaction);
    numberOfPlayers = playingUsers.length;

    if (numberOfPlayers < 5) {
      console.log("Not enough players (need at least 5)");
      await interaction.reply({
        content: "Error: Not enough players (need at least 5)",
        ephemeral: true,
      });
    }

    numberOfWerewolves = Math.floor(numberOfPlayers / 3);

    console.log(playingUsers);

    townSquarePermissions = [
      {
        id: interaction.guild.id,
        allow: ["VIEW_CHANNEL"],
        deny: ["SEND_MESSAGES"],
      },
    ];

    const ChannelNames = {
      TOWN_SQUARE: "town-square",
      WEREWOLVES: "werewolves",
      SEER: "seer",
    };

    const currentChannels = await interaction.guild.channels.fetch();
    // remove old channels
    currentChannels.forEach((channel) => {
      switch (channel.name) {
        case ChannelNames.TOWN_SQUARE:
        case ChannelNames.WEREWOLVES:
        case ChannelNames.SEER:
          channel.delete();
      }
    });

    // create new channels
    createChannel(interaction, "town-square");
    createChannel(interaction, "werewolves");
    createChannel(interaction, "seer"); // Might not need this?

    // We might not have to make these channels but commands that only they see?
    // hunter
    // Mason
    // Baker
    // Bodyguard
    // Love birds?

    await interaction.reply({ content: "Game Created", ephemeral: true });
  },
};

async function createChannel(interaction, name) {
  interaction.guild.channels.create(name, {
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: ["SEND_MESSAGES", "VIEW_CHANNEL"],
      },
      // {
      //   id: interaction.guild.id,
      //   allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
      // },
    ],
  });
}
