const _ = require("lodash");
const { findManyUsers, findUser, updateUser } = require("../../werewolf_db");
const { characters } = require("./characterUtil");
const { removesDeadPermissions, WaysToDie } = require("../deathHelper");
const { PowerUpNames } = require("../powerUpHelpers");
const { getRandomGif } = require("../botMessages/randomGif");

async function executeSerialKillerKill(interaction, guardedIds, existingDeathIds = []) {
  const guildId = interaction.guild.id;
  const members = interaction.guild.members.cache;
  const channels = interaction.guild.channels.cache;

  const cursor = await findManyUsers({
    guild_id: guildId,
    character: characters.SERIAL_KILLER,
    is_dead: false,
  });
  const serialKillers = await cursor.toArray();

  if (_.isEmpty(serialKillers)) return "";

  const messages = [];

  await Promise.all(
    _.map(serialKillers, async (sk) => {
      const targetId = sk.serial_kill_target_id;
      await updateUser(sk.user_id, guildId, { serial_kill_target_id: null });

      if (!targetId) return;

      const skChannel = channels.get(sk.channel_id?.toString());

      if (guardedIds.includes(targetId)) {
        const guardGif = await getRandomGif("bodyguard");
        await skChannel?.send(`Your target was protected by a bodyguard last night. Your kill was [blocked](${guardGif || ""}).`);
        return;
      }

      if (existingDeathIds.includes(targetId)) {
        const slowGif = await getRandomGif("slow");
        await skChannel?.send(`Your target was already killed last night [before you could act.](${slowGif || ""})`);
        return;
      }

      const targetDbUser = await findUser(targetId, guildId);
      if (!targetDbUser || targetDbUser.is_dead) return;

      const targetMember = members.get(targetId);

      const deathCharacter = await removesDeadPermissions(
        interaction,
        targetDbUser,
        targetMember,
        WaysToDie.MURDERED
      );

      if (deathCharacter === PowerUpNames.SHIELD) {
        const shieldGif = await getRandomGif("shield");
        await skChannel?.send(`🛡️ Your target had a [shield](${shieldGif || ""}) and survived your attack! The shield has been consumed.`);
        const missedGif = await getRandomGif("shielded");
        messages.push(`\n* Last night, a player got away from a serial killer attack. Their [shield](${missedGif || ""}) was consumed.\n`);
        return;
      }

      messages.push(
        `\n* Last night, the ${deathCharacter} ${targetMember} was [MURDERED](${_.sample(murderGif)}).\n`
      );
    })
  );

  return messages.join("");
}

async function getAliveSerialKillerIds(guildId) {
  const cursor = await findManyUsers({
    guild_id: guildId,
    character: characters.SERIAL_KILLER,
    is_dead: false,
  });
  const serialKillers = await cursor.toArray();
  return _.map(serialKillers, (sk) => sk.user_id);
}

const murderGif = [
  'https://tenor.com/bcUvL.gif',
  'https://tenor.com/cMnj8a1Macb.gif',
  'https://tenor.com/bkoHw.gif',
  'https://tenor.com/oWfx.gif',
  'https://tenor.com/Yw05.gif',
  'https://tenor.com/bortz.gif',
  'https://tenor.com/bmpHd.gif',
  'https://tenor.com/t4Ul.gif',
  'https://tenor.com/gXlYg44WHSm.gif',
  'https://tenor.com/j5Q0LXSj6Tb.gif',
  'https://tenor.com/bxz2d.gif',
  'https://tenor.com/rxnin5tL5XH.gif',
  'https://tenor.com/bfC6H.gif',
  'https://tenor.com/bjD8W.gif',
  'https://tenor.com/bvZbv.gif',
  'https://tenor.com/byuPF.gif',
  'https://tenor.com/bWxR8.gif',
];

module.exports = { executeSerialKillerKill, getAliveSerialKillerIds };
