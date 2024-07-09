const {
  getRole,
  roleNames,
  isAlive,
  isPlaying,
  isDead,
} = require("../util/rolesHelpers");


async function playingResponse(interaction) {
  const member = interaction.member;
  if (isAlive(member) || isPlaying(member) || isDead(member)) {
    await interaction.reply({
      content: "You are already Playing",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const playingRole = await getRole(interaction, roleNames.PLAYING);
  await member.roles.add(playingRole);

  await interaction.editReply({
    content: `${interaction.user} is now playing`,
  });
}

async function stopPlayingResponse(interaction) {
  const member = interaction.member;
  if (isPlaying(member)) {
    const playingRole = await getRole(interaction, roleNames.PLAYING);
    await member.roles.remove(playingRole);

    await interaction.reply({
      content: `You have removed yourself from playing.`,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: "You are currently not in the queue to play",
      ephemeral: true,
    });
    return;
  }
}

module.exports = {
  playingResponse,
  stopPlayingResponse,
};