const _ = require("lodash");
const {
  findManyUsers,
  findUser,
  updateUser,
  findSettings,
} = require("../../werewolf_db");
const { organizeChannels, joinMasons } = require("../channelHelpers");
const { characters } = require("./characterUtil");
const { fetchMember } = require("../discordHelpers");
const { isSmokeBombed } = require("../powerUp/smokeBombHelper");

async function guardPlayers(interaction) {
  const guildId = interaction.guild.id;
  const members = interaction.guild.members.cache;
  const cursorBodyguards = await findManyUsers({
    guild_id: guildId,
    character: characters.BODYGUARD,
  });
  const settings = await findSettings(guildId);
  const bodyGuards = await cursorBodyguards.toArray();

  const guardedIds = await Promise.all(
    _.map(bodyGuards, async (bodyguard) => {
      const guardedUserId = bodyguard.guarded_user_id;
      if (!guardedUserId) {
        await updateUser(bodyguard.user_id, guildId, {
          last_guarded_user_id: null,
        });
        return;
      }

      const guardedUser = await findUser(guardedUserId, guildId);
      if (isSmokeBombed(guardedUser)) {
        const organizedChannels = organizeChannels(interaction.guild.channels.cache);
        await organizedChannels.bodyguard.send(
          `💨 You went to guard ${members.get(guardedUserId) || guardedUser.nickname || guardedUser.name} last night, but they threw down a smoke bomb and vanished. You were not able to guard them. 💨`
        );
        // The guard failed, so they are free to guard this player again tonight.
        await updateUser(bodyguard.user_id, guildId, {
          last_guarded_user_id: null,
          guarded_user_id: null,
        });
        return;
      }
      if (settings.bodyguard_joins_masons) {
        await joinMasons({
          interaction,
          targetUser: guardedUser,
          player: bodyguard,
          playerMember: await fetchMember(interaction, bodyguard.user_id),
          roleName: "bodyguard",
        });
      }
      await guardedVampireMessage({
        interaction,
        guardedUser,
        guardedMember: members.get(guardedUser.user_id),
      });

      await updateUser(bodyguard.user_id, guildId, {
        last_guarded_user_id: guardedUserId,
        guarded_user_id: null,
      });

      return guardedUserId;
    })
  );

  return guardedIds;
}

async function guardedVampireMessage({
  interaction,
  guardedUser,
  guardedMember,
}) {
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  if (guardedUser.is_vampire || guardedUser.character === characters.WITCH) {
    await organizedChannels.bodyguard.send(
      `While guarding ${guardedMember} you notice something off about them. They are not a villager.. They are a vampire!`
    );
  }
}

async function sendSuccessfulGuardMessage(interaction, successfulGuardIds) {
  const members = interaction.guild.members.cache;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const savedMembers = _.map(successfulGuardIds, (id) => members.get(id))

  if (!_.isEmpty(savedMembers)) {
    organizedChannels.werewolves.send(`Your attack on ${savedMembers.join(", ")} failed last night. They were either protected by a bodyguard or are able to defend against your attacks.`)
  }
}

module.exports = {
  guardPlayers,
  sendSuccessfulGuardMessage,
};
