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



  await Promise.all(
    _.map(cupids, async (cupid) => {
      return shootArrows(interaction, cupid)
    })
  );
}

async function shootArrows(interaction, cupid) {
  let userIdsHitByArrow = cupid.cupid_hit_ids
  if (_.isEmpty(userIdsHitByArrow)) {
    const randomLovers = await randomUser(interaction.guild.id, {
      user_id: { $not: cupid.user_id },
      is_dead: false,
      is_injured: false,
      is_muted: false,
    }, 2)
    userIdsHitByArrow = _.map(randomLovers, (u) => u.user_id)
  }

  const cursorLoveMatch = await findManyUsers({
    guild_id: interaction.guild.id,
    user_id: { $in: userIdsHitByArrow }
  });
  const usersInLove = await cursorLoveMatch.toArray();

  await Promise.all(
    _.map(usersInLove, (user) => {
      const inLoveWith = usersInLove.filter((u) => u.user_id !== user.user_id)
      return updateUser(user.user_id, interaction.guild.id, {
        in_love_with_ids: [...user.in_love_with_ids, ...inLoveWith.map((u) => u.user_id)],
        cupid_id: cupid.user_id,
      })
    })
  );

  const chaosDemons = _.filter(usersInLove, (u) => u.character === characters.CHAOS_DEMON)
  if (!_.isEmpty(chaosDemons)) {
    for (const demon of chaosDemons) {
      const inLoveWithUser = _.sample(_.filter(usersInLove, (u) => u.user_id !== demon.user_id))
      await chaosDemonInLove(interaction, demon, inLoveWithUser)
    }
  }

  const loversChanel = await addLoversInChannel(interaction, usersInLove)

  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const members = interaction.guild.members.cache;
  const membersInLove = _.map(usersInLove, (u) => `${members.get(u.user_id)}`)
  organizedChannels.afterLife.send(`${membersInLove.join(" and ")} are in love.`)

  await loversChanel.send(`${membersInLove.join(" and ")} you are now in love. Use this chanel to plan out how to stay alive together.`)

  await updateUser(cupid.user_id, interaction.guild.id, {
    cupid_success_hits: true
  })
}

function buildCoupleTeam(cupid, allDbUsers) {
  const cupidsCouple = allDbUsers.filter((u) => cupid.cupid_hit_ids.includes(u.user_id));
  if (_.some(cupidsCouple, ['is_dead', true])) {
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
};
