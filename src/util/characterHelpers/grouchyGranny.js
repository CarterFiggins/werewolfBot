const _ = require("lodash");
const { updateUser, findAllUsers } = require("../../werewolf_db");
const { characters } = require("../commandHelpers");
const { organizeChannels, channelNames, giveChannelPermissions } = require("../channelHelpers");

async function returnMutedPlayers(interaction, guildId) {
  const cursor = await findAllUsers(guildId);
  const users = await cursor.toArray();
  const members = interaction.guild.members.cache;

  await Promise.all(
    users.map(async (user) => {
      if (user.isMuted) {
        const channels = await interaction.guild.channels.fetch();
        const organizedChannels = organizeChannels(channels);
        const member = members.get(user.user_id)
        await updateUser(user.user_id, guildId, { isMuted: false, safeFromMutes: true });
        message = `${member} has returned`
        giveChannelPermissions({
          interaction,
          user: member,
          character: user.character,
          message,
        });
        if (user.character !== characters.VILLAGER) {
          giveChannelPermissions({
            interaction,
            user: member,
            character: characters.VILLAGER,
            message,
          });
        }
        if (user.is_vampire) {
          giveChannelPermissions({
            interaction,
            user: member,
            character: characters.VAMPIRE,
            message,
          });
        }
        if (user.on_mason_channel) {
          giveChannelPermissions({
            interaction,
            user: member,
            character: characters.MASON,
            message,
          });
        }

        await organizedChannels.outCasts.permissionOverwrites.edit(member, {
          SEND_MESSAGES: false,
          VIEW_CHANNEL: false,
        });
      }
    })
  );
}

async function removeSafeFromMutes(guildId) {
  const cursor = await findAllUsers(guildId);
  const users = await cursor.toArray();
  await Promise.all(
    users.map(async (user) => {
      await updateUser(user.user_id, guildId, { safeFromMutes: false });
    })
  );
}

async function castOutUser(interaction, user) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  await Promise.all(
    _.map(organizedChannels, async (channel) => {
      if (channel.name === channelNames.OUT_CASTS) {
        await channel.permissionOverwrites.edit(user, {
          SEND_MESSAGES: true,
          VIEW_CHANNEL: true,
        });
      } else {
        await channel.permissionOverwrites.edit(user, {
          SEND_MESSAGES: false,
          CREATE_PRIVATE_THREADS: false,
          CREATE_PUBLIC_THREADS: false,
          SEND_MESSAGES_IN_THREADS: false,
        });
      }
    })
  );
}

module.exports = {
  returnMutedPlayers,
  castOutUser,
  removeSafeFromMutes,
};
