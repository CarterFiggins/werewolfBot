const _ = require("lodash");
const {
  findManyUsers,
  findUser,
  updateUser,
  findSettings,
} = require("../../werewolf_db");
const { organizeChannels, joinMasons } = require("../channelHelpers");
const { characters } = require("./characterUtil");

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
      if (settings.bodyguard_joins_masons) {
        await joinMasons({
          interaction,
          targetUser: guardedUser,
          player: bodyguard,
          playerMember: members.get(bodyguard.user_id),
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

  organizedChannels.werewolves.send(`Last night's attack didn't go as planned because you got scared off! The bodyguard was on duty, protecting ${savedMembers.join(", ")}, and you decided it wasn't worth the risk.`)
}

module.exports = {
  guardPlayers,
  sendSuccessfulGuardMessage,
};
