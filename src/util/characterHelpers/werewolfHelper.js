const _ = require("lodash");
const { findUsersWithIds, updateUser, findSettings, findGame, findManyUsers, updateManyUsers } = require("../../werewolf_db");
const {
  giveChannelPermissions,
  organizeChannels,
} = require("../channelHelpers");
const { characters } = require("./characterUtil");
const { werewolfKillDeathMessage } = require("../deathHelper");
const { sendMemberMessage } = require("../botMessages/sendMemberMessages");

async function getKillTargetedUsers(interaction) {
  const guildId = interaction.guild.id;
  const game = await findGame(guildId);
  const cursorWerewolves = await findManyUsers({
    guild_id: guildId,
    is_dead: false,
    character: characters.WEREWOLF,
  });
  const werewolves = await cursorWerewolves.toArray();
  if (_.isEmpty(werewolves)) {
    return [];
  }

  const targetedIds = []
  const usersIdsToBeKilled = []

  _.forEach(werewolves, (wolf) => targetedIds.push(...wolf.kill_targeted_user_ids));
  const randomTargetId = _.sample(targetedIds);
  if (randomTargetId) {
    usersIdsToBeKilled.push(randomTargetId);
  }

  if (game.wolf_double_kill) {
    const secondRandomTarget = _.sample(_.reject(targetedIds, (id) => id === randomTargetId));
    if (secondRandomTarget) {
      usersIdsToBeKilled.push(secondRandomTarget);
    }
  }

  // reset werewolves targets
  await updateManyUsers({ guild_id: guildId, character: characters.WEREWOLF }, { kill_targeted_user_ids: [] });

  return usersIdsToBeKilled
}

async function killPlayers(interaction, deathIds) {
  const guildId = interaction.guild.id;
  const members = await interaction.guild.members.fetch();
  const game = await findGame(guildId);
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const cursor = await findUsersWithIds(guildId, deathIds);
  const deadUsers = await cursor.toArray();
  const settings = await findSettings(guildId);
  let message = [];

  await Promise.all(
    _.map(deadUsers, async (deadUser) => {
      const deadMember = members.get(deadUser.user_id);
      let isDead = true;

      if (deadUser.character === characters.MUTATED) {
        // join werewolf team
        await updateUser(deadUser.user_id, interaction.guild.id, {
          character: characters.WEREWOLF,
          kill_targeted_user_ids: [],
        });
        await giveChannelPermissions({
          interaction,
          user: deadMember,
          character: characters.WEREWOLF,
        });
        await organizedChannels.werewolves.send(
          `You went after ${deadMember} last night, but things took an unexpected twist. Turns out, your attack triggered their mutated DNA, and they transformed into a werewolf!\nWelcome to the pack, ${deadMember}! The hunt just got a little wilder. :wolf:`
        );
        isDead = false;
      } else if (
        deadUser.character === characters.WITCH &&
        !settings.wolf_kills_witch
      ) {
        await giveChannelPermissions({
          interaction,
          user: deadMember,
          character: characters.WEREWOLF,
        });
        await organizedChannels.werewolves.send(
          `You went after ${deadMember} last night, but guess what? ${deadMember} was the witch, and your attack didn't quite go as planned. The twist? The witch has now joined your chat!\nWelcome, ${deadMember}! The hunt just got a little more magical.`
        );
        isDead = false;
      } else if (game.first_night && settings.werewolf_creates_henchman) {
        const canNotBeHenchman = [characters.VAMPIRE, characters.CHAOS_DEMON]
        if (!canNotBeHenchman.includes(deadUser.character)) {
          isDead = false;
          await updateUser(deadUser.user_id, interaction.guild.id, {
            is_henchman: true,
          });
          await sendMemberMessage(
            deadMember,
            `Under cover of darkness, the werewolves approached—but instead of tearing you apart, they whispered a sinister offer.
You are no longer a mere villager. You are now the Henchman — a secret agent of deception working from within. The villagers still believe you are one of them, but your loyalty lies with the wolves.
Your new goal: sow confusion, mislead the town, and protect the werewolves at all costs. Use your influence to misdirect, cast suspicion, and sabotage the villagers’ efforts. Do whatever it takes to keep the wolves hidden and help them win... from the shadows.
You do not count as a villager or a werewolf for victory.`
          );
          await organizedChannels.werewolves.send(`${deadMember} now serves the pack as your hidden Henchman.`)
          await organizedChannels.afterLife.send(`${deadMember} now serves the werewolves as the Henchman.`)
        }
      }
      else if (deadUser.has_lycan_guard) {
        await organizedChannels.werewolves.send(
          `${deadMember} is a lycan! It turns out they were tougher than you expected! Your attack was unsuccessful this time. However, now you know what you’re up against, and next time you’ll be prepared to take them down.`
        );
        await updateUser(deadUser.user_id, interaction.guild.id, {
          has_lycan_guard: false,
        });
        isDead = false;
      }

      if (isDead) {
        message.push(`* ${await werewolfKillDeathMessage({ interaction, deadMember, deadUser })}`)
      }
    })
  );

  return message.join("\n");
}

module.exports = {
  killPlayers,
  getKillTargetedUsers,
};
