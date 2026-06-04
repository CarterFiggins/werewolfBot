const _ = require("lodash");
const { findManyUsers, findUser, updateUser } = require("../../werewolf_db");
const { characters } = require("./characterUtil");
const { removesDeadPermissions, WaysToDie } = require("../deathHelper");
const { PowerUpNames } = require("../powerUpHelpers");

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
        await skChannel?.send(`Your target was protected by a bodyguard last night. Your kill was blocked.`);
        return;
      }

      if (existingDeathIds.includes(targetId)) {
        await skChannel?.send(`Your target was already killed last night before you could act.`);
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
        await skChannel?.send(`🛡️ Your target had a shield and survived your attack! The shield has been consumed.`);
        return;
      }

      messages.push(
        `* Last night, the ${deathCharacter} ${targetMember} was MURDERED.\n${_.sample(murderGif)}\n`
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
];

module.exports = { executeSerialKillerKill, getAliveSerialKillerIds };
