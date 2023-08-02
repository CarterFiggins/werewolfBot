const _ = require("lodash");
const { updateUser, findAllUsers } = require("../../werewolf_db");
const { characters } = require("../commandHelpers");
const { organizeChannels, channelNames, giveChannelPermissions } = require("../channelHelpers");

async function returnKickedPlayers(interaction, guildId) {
  const cursor = await findAllUsers(guildId);
  const users = await cursor.toArray();
  const members = interaction.guild.members.cache;

  const kickedUsers = []

  await Promise.all(
    users.map(async (user) => {
      if (user.isKicked) {
        await updateUser(user.user_id, guildId, { isKicked: false });
        kickedUsers.push(user)
        const member = members.get(user.user_id)
        message = `${member} has return`
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
      }
    })
  );
}

async function removePermissionsFromKick(interaction, user) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  await Promise.all(
    _.map(organizedChannels, async (channel) => {
      if (channel.name !== channelNames.AFTER_LIFE) {
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
  returnKickedPlayers,
  removePermissionsFromKick,
};
