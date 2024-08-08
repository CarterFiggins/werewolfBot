const {
  getRole,
  roleNames,
  isAlive,
  isPlaying,
  isDead,
} = require("./rolesHelpers");


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

async function joinTheDeadResponse(interaction) {
  const member = interaction.member;
  if (isAlive(member)) {
    await interaction.reply({
      content: "https://tenor.com/pym7KF2INdx.gif",
      ephemeral: true,
    });
    return;
  }
  if (isDead(member)) {
    await interaction.reply({
      content: "https://tenor.com/bCebX.gif",
      ephemeral: true,
    });
    return;
  }
  const deadRole = await getRole(interaction, roleNames.DEAD);
  await member.roles.add(deadRole);
  await interaction.reply({
    content: `Welcome to the dead ⚰️`,
    ephemeral: true,
  });
}

module.exports = {
  playingResponse,
  stopPlayingResponse,
  joinTheDeadResponse,
};