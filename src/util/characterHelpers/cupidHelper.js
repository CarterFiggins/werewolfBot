const _ = require("lodash");
const { findManyUsers, updateUser } = require("../../werewolf_db");
const { characters, findCharactersTeam } = require("./characterUtil");
const { addLoversInChannel, organizeChannels } = require("../channelHelpers");
const { randomUser } = require("../userHelpers");
const { chaosDemonInLove } = require("./chaosDemonHelpers");

async function shootCupidsArrows(interaction) {
  const cursorDoppelganger = await findManyUsers({
    guild_id: interaction.guild.id,
    character: characters.CUPID,
    cupid_success_hits: false
  });
  const cupids = await cursorDoppelganger.toArray();



  for (const cupid of cupids) {
    await shootArrows(interaction, cupid)
  }
}

async function shootArrows(interaction, cupid) {
  let userIdsHitByArrow = cupid.cupid_hit_ids
  if (_.isEmpty(userIdsHitByArrow)) {
    const randomLovers = await randomUser(interaction.guild.id, {
      user_id: { $ne: cupid.user_id },
      is_dead: false,
      is_injured: false,
    }, 2)
    userIdsHitByArrow = _.map(randomLovers, (u) => u.user_id)
    await updateUser(cupid.user_id, interaction.guild.id, {
      cupid_hit_ids: userIdsHitByArrow
    })
  }

  const cursorLoveMatch = await findManyUsers({
    guild_id: interaction.guild.id,
    user_id: { $in: userIdsHitByArrow }
  });
  const usersInLove = await cursorLoveMatch.toArray();

  for (const user of usersInLove) {
    const inLoveWith = usersInLove.filter((u) => u.user_id !== user.user_id)
    await updateUser(user.user_id, interaction.guild.id, {
      in_love_with_ids: [...user.in_love_with_ids, ...inLoveWith.map((u) => u.user_id)],
      cupid_id: cupid.user_id,
    })
  }
  const chaosDemons = _.filter(usersInLove, (u) => u.character === characters.CHAOS_DEMON)
  if (!_.isEmpty(chaosDemons)) {
    for (const demon of chaosDemons) {
      const inLoveWithUser = _.sample(_.filter(usersInLove, (u) => u.user_id !== demon.user_id))
      await chaosDemonInLove(interaction, demon, inLoveWithUser)
    }
  }

  const loversChanel = await addLoversInChannel(interaction, usersInLove)

  await Promise.all(
    usersInLove.map((user) =>
      updateUser(user.user_id, interaction.guild.id, {
        lovers_channel_id: loversChanel.id,
      })
    )
  )

  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const members = interaction.guild.members.cache;
  const membersInLove = _.map(usersInLove, (u) => `${members.get(u.user_id) || u.nickname || u.name}`)
  organizedChannels.afterLife.send(`${membersInLove.join(" and ")} are in love.`)

  await loversChanel.send(`${membersInLove.join(" and ")} you are now in love. Use this channel to plan out how to stay alive together.`)

  await updateUser(cupid.user_id, interaction.guild.id, {
    cupid_success_hits: true
  })
}

async function sendLoveProtectedMessage(interaction, protectedUserIds) {
  if (_.isEmpty(protectedUserIds)) return;

  const guildId = interaction.guild.id;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const members = interaction.guild.members.cache;

  const cursor = await findManyUsers({
    guild_id: guildId,
    user_id: { $in: protectedUserIds },
  });
  const protectedUsers = await cursor.toArray();

  await Promise.all(
    protectedUsers.map(async (user) => {
      const loversChannel = channels.get(user.lovers_channel_id?.toString());
      const member = members.get(user.user_id);
      await loversChannel?.send(
        `💘 The werewolves came for ${member || user.nickname || user.name} last night, but love got in the way — their attack was blocked.`
      );

      const cursorWolfLovers = await findManyUsers({
        guild_id: guildId,
        user_id: { $in: user.in_love_with_ids },
        character: characters.WEREWOLF,
        is_dead: false,
      });
      const wolfLovers = await cursorWolfLovers.toArray();
      const wolfMembers = wolfLovers
        .map((wolf) => `${members.get(wolf.user_id) || wolf.nickname || wolf.name}`)
        .join(" and ");

      await organizedChannels?.werewolves?.send(
        `💘 ${wolfMembers} fell in love with ${member || user.nickname || user.name} and is now protecting them from harm — the pack's attack on ${member || user.nickname || user.name} failed and is now protected by ${wolfMembers}.`
      );
    })
  );
}

function buildCoupleTeam(cupid, allDbUsers) {
  const cupidsCouple = allDbUsers.filter((u) => cupid.cupid_hit_ids.includes(u.user_id));
  if (_.some(cupidsCouple, ['is_dead', true]) || _.isEmpty(cupidsCouple)) {
    return false
  }
  let currentTeam = false;
  let onSameTeam = true;
  
  cupidsCouple.forEach((u) => {
    const team = findCharactersTeam(u)
    if (!currentTeam) {
      currentTeam = team;
    }
    if (team !== currentTeam) {
      onSameTeam = false;
    }
  })

  const couplesTeam = onSameTeam && currentTeam;

  return {
    cupid,
    cupidsCouple,
    couplesTeam,
  }
}

module.exports = {
  shootCupidsArrows,
  buildCoupleTeam,
  sendLoveProtectedMessage,
};
