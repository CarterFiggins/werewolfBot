const _ = require("lodash");
const { findOneUser, updateUser } = require("../../werewolf_db");
const { getAliveUsersIds } = require("../discordHelpers");
const { characters } = require("./characterUtil");

async function markChaosTarget(interaction) {
  const chaosDemon = await findOneUser({
    guild_id: interaction.guild.id,
    character: characters.CHAOS_DEMON,
    is_dead: false
  })

  if (!chaosDemon) {
    return
  }
  
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

  await updateUser(selectedChaosUserId, interaction.guild.id, {
    is_chaos_target: true,
  })
}

async function isDeadChaosTarget(interaction, deadUser) {
  if (deadUser.is_chaos_target) {
    const chaosDemon = await findOneUser({
      guild_id: interaction.guild.id,
      character: characters.CHAOS_DEMON,
      is_dead: false,
    });
    if (chaosDemon) {
      return true;
    }
  }
  return false;
}

module.exports = {
  markChaosTarget,
  isDeadChaosTarget,
}