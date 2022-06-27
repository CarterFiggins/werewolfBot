const _ = require("lodash");
const { findManyUsers, findUser, updateUser } = require("../../werewolf_db");
const {
  giveChannelPermissions,
  organizeChannels,
} = require("../channelHelpers");
const { characters } = require("../commandHelpers");

async function guardPlayers(interaction) {
  const guildId = interaction.guild.id;
  const members = interaction.guild.members.cache;
  const cursorBodyguards = await findManyUsers({
    guild_id: guildId,
    character: characters.BODYGUARD,
  });
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
      await joinMasons({
        interaction,
        guardedUser,
        bodyguard,
        bodyguardMember: members.get(bodyguard.user_id),
      });
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

async function joinMasons({
  interaction,
  guardedUser,
  bodyguard,
  bodyguardMember,
}) {
  if (
    guardedUser.character === characters.MASON &&
    !bodyguard.on_mason_channel
  ) {
    await updateUser(bodyguard.user_id, interaction.guild.id, {
      on_mason_channel: true,
    });
    await giveChannelPermissions({
      interaction,
      user: bodyguardMember,
      character: characters.MASON,
      message: `The bodyguard ${bodyguardMember} has joined!`,
    });
  }
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

module.exports = {
  guardPlayers,
};
