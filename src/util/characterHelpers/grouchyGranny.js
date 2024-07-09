const _ = require("lodash");
const { updateUser, findAllUsers, findManyUsers, findUser } = require("../../werewolf_db");
const { characters } = require("./characterUtil");
const { organizeChannels, channelNames, giveChannelPermissions } = require("../channelHelpers");

async function mutePlayers(interaction) {
  const cursorGrannies = await findManyUsers({
    guild_id: interaction.guild.id,
    is_dead: false,
    character: characters.GROUCHY_GRANNY,
  });
  const members = interaction.guild.members.cache;
  const grannies = await cursorGrannies.toArray()
  for (const granny of grannies) {
    if (granny.muteUserId) {
      const muteMember = members.get(granny.muteUserId)
      const muteUserDb = findUser(granny.muteUserId, interaction.guild.id)
      if (!muteUserDb.is_dead) {
        await castOutUser(interaction, muteMember)
      }
      await updateUser(granny.user_id, interaction.guild.id, {
        muteUserId: null,
      });
    }
  }
}

async function returnMutedPlayers(interaction, guildId) {
  const cursor = await findAllUsers(guildId);
  const users = await cursor.toArray();
  const members = interaction.guild.members.cache;

  await Promise.all(
    users.map(async (user) => {
      if (user.isMuted && !user.is_dead) {
        const channels = await interaction.guild.channels.fetch();
        const organizedChannels = organizeChannels(channels);
        const member = members.get(user.user_id)
        await updateUser(user.user_id, guildId, { isMuted: false, safeFromMutes: true });
        message = `${member} has returned from being muted.`
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

        if (user.character !== characters.GROUCHY_GRANNY) {
          await organizedChannels.outCasts.permissionOverwrites.edit(member, {
            SendMessages: false,
            ViewChannel: false,
          });
        }
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

async function castOutUser(interaction, member) {
  await updateUser(member.id, interaction.guild.id, {
    isMuted: true,
  });
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  await Promise.all(
    _.map(organizedChannels, async (channel) => {
      if (channel.name === channelNames.OUT_CASTS) {
        await channel.permissionOverwrites.edit(member, {
          SendMessages: true,
          ViewChannel: true,
        });
      } else if (channel.name === channelNames.AFTER_LIFE) {
        // Don't change permissions here
      } else {
        await channel.permissionOverwrites.edit(member, {
          SendMessages: false,
          CreatePrivateThreads: false,
          CreatePublicThreads: false,
          SendMessagesInThreads: false,
        });
        if (channel.name === channelNames.TOWN_SQUARE) {
          channel.send(`Grouchy Granny has muted ${member}. They can talk tomorrow`)
        }
      }
    })
  );
}

module.exports = {
  returnMutedPlayers,
  castOutUser,
  removeSafeFromMutes,
  mutePlayers,
};
