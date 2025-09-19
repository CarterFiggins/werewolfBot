const _ = require("lodash");
const { findOneUser, updateUser, findManyUsers } = require("../../werewolf_db");
const { getAliveUsersIds } = require("../discordHelpers");
const { characters } = require("./characterUtil");
const { organizeChannels } = require("../channelHelpers");
const { sendMemberMessage } = require("../botMessages/sendMemberMessages");

async function markChaosTarget(interaction) {
  const cursorChaosDemon = await findManyUsers({
    guild_id: interaction.guild.id,
    character: characters.CHAOS_DEMON,
    is_dead: false
  })
  const chaosDemons = await cursorChaosDemon.toArray();

  if (_.isEmpty(chaosDemons)) {
    return
  }

  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const members = interaction.guild.members.cache;

  for (const chaosDemon of chaosDemons) {
    let selectedChaosUserId = chaosDemon.chaos_target_user_id
    if (!selectedChaosUserId) {
      let aliveUserIds = await getAliveUsersIds(interaction);
      aliveUserIds = _.filter(aliveUserIds, (id) => id != chaosDemon.user_id)
      const targetUserId = _.sample(aliveUserIds);
      await updateUser(chaosDemon.user_id, interaction.guild.id, {
        chaos_target_user_id: targetUserId,
      });
      selectedChaosUserId = targetUserId
    }
    const demonMember = members.get(chaosDemon.user_id)
    const targetMember = members.get(selectedChaosUserId)
    const targetUsername = targetMember.nickname || targetMember.username
    organizedChannels.afterLife.send(`${demonMember} the chaos demon has chosen ${targetMember}`)
    await updateUser(selectedChaosUserId, interaction.guild.id, {
      is_chaos_target: true,
    })
    await sendMemberMessage(demonMember, `You have chosen to target ${targetUsername}. Get the villagers to hang this player. If they die in any other way you will die. Let Chaos reign, then rein in Chaos!`)
  }
}

async function foundAliveChaosDemonsWithTarget(interaction, deadUser) {
  if (deadUser?.is_chaos_target) {
    const cursorChaosDemons = await findManyUsers({
      guild_id: interaction.guild.id,
      character: characters.CHAOS_DEMON,
      chaos_target_user_id: deadUser.user_id,
      is_dead: false,
    });
    return await cursorChaosDemons.toArray();
  }
  return [];
}

async function getChaosWinIds(playersDeathInfo) {
  const targetsHanged = _.filter(playersDeathInfo, (p) => !_.isEmpty(p.chaosWinsIds))
  
  if (!_.isEmpty(targetsHanged)) {
    return _.flatMap(targetsHanged, (t) => t.chaosWinsIds)
  }
  return []
}

async function chaosDemonInLove(interaction, demon, inLoveWithUser) {
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  if (demon.chaos_target_user_id) {
    await updateUser(demon.chaos_target_user_id, interaction.guild.id, {
      is_chaos_target: false
    });
  }

  await updateUser(demon.user_id, interaction.guild.id, {
    chaos_target_user_id: inLoveWithUser.user_id,
  });
  await updateUser(inLoveWithUser.user_id, interaction.guild.id, {
    is_chaos_target: true
  });
  
  const members = interaction.guild.members.cache;
  const demonMember = members.get(demon.user_id)
  const loverMember = members.get(inLoveWithUser.user_id)
  const username = loverMember.nickname || loverMember.username
  await sendMemberMessage(demonMember, `Cupid has struck you with their arrow. Instead of love you want Chaos! Your new target will now be ${username} (the player that is in love with you. Don't let them know you want them to be hanged!)`)
  organizedChannels.afterLife.send(`Cupid has struck the chaos demon ${demonMember} and has cause them to change their chaos target to ${loverMember}. (the player that they are in love with)`)
}

module.exports = {
  markChaosTarget,
  foundAliveChaosDemonsWithTarget,
  getChaosWinIds,
  chaosDemonInLove,
}