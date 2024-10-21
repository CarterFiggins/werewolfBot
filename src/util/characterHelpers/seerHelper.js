const _ = require("lodash");
const { updateUser, findManyUsers, findUser, findSettings } = require("../../werewolf_db");
const { giveChannelPermissions, organizeChannels, joinMasons } = require("../channelHelpers");
const { characters } = require("./characterUtil");

async function handleApprenticeSeer(interaction, deadDbSeer) {
  const guildId = interaction.guild.id;
  const apprenticeSeers = await (
    await findManyUsers({
      guild_id: guildId,
      is_dead: false,
      character: characters.APPRENTICE_SEER,
    })
  ).toArray();

  if (_.isEmpty(apprenticeSeers)) {
    return
  }

  const channels = interaction.guild.channels.cache;
  const deadSeerChannel = channels.get(deadDbSeer.channel_id.toString());

  const apprenticeSeerUser = _.sample(apprenticeSeers);
  const discordApprenticeUser = interaction.guild.members.cache.get(
    apprenticeSeerUser.user_id
  );

  await updateUser(apprenticeSeerUser.user_id, guildId, {
    character: characters.SEER,
  });

  await giveChannelPermissions({
    interaction,
    user: discordApprenticeUser,
    character: characters.SEER,
    joiningDbUser: deadDbSeer,
  });

  await deadSeerChannel.send(
    `${discordApprenticeUser} With the Seer's death, you have gained their power. Each night, you can investigate a player\nThe spirts will tell you if the player is a villager or a werewolf. Good luck!`
  );
}

async function sendInvestigateMessage(interaction, seer) {
  if (!seer.investigateUserId) return;

  const members = interaction.guild.members.cache;
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  const member = members.get(seer.investigateUserId)
  const seerMember = members.get(seer.user_id)
  const targetDbUser = await findUser(seer.investigateUserId, interaction.guild?.id);
  const guildSettings = await findSettings(interaction.guild.id);
  let revealedCharacter = "villager!"
  if (seer.character === characters.FOOL) {
    const randomNumber = _.random(1, 3);
    // 33% chance of fool getting a werewolf
    if (randomNumber === 1) {
      revealedCharacter = "werewolf!";
    }
  } else {
    if (
      targetDbUser.character === characters.WEREWOLF ||
      targetDbUser.character === characters.LYCAN
    ) {
      revealedCharacter = "werewolf!";
    }
    if (guildSettings.seer_joins_masons) {
      await joinMasons({
        interaction,
        targetUser: targetDbUser,
        player: seer,
        playerMember: seerMember,
        roleName: characters.SEER,
      });
    }
  }

  const seerChannel = channels.get(seer.channel_id.toString());
  await seerChannel.send(`${seerMember}! Your vision reveals that ${member} is a ${revealedCharacter}`)
}

async function investigatePlayers(interaction) {
  const cursorSeers = await findManyUsers({
    guild_id: interaction.guild.id,
    is_dead: false,
    character: { $in: [characters.SEER, characters.FOOL] }
  });
  const seers = await cursorSeers.toArray();

  for (const seer of seers) {
    await sendInvestigateMessage(interaction, seer)
    await updateUser(seer.user_id, interaction.guild.id, {
      investigateUserId: null
    })
  }
}

module.exports = {
  handleApprenticeSeer,
  investigatePlayers,
};
