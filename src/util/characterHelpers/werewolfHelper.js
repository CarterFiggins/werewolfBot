const _ = require("lodash");
const { findUsersWithIds, updateUser, findSettings } = require("../../werewolf_db");
const {
  giveChannelPermissions,
  organizeChannels,
} = require("../channelHelpers");
const { characters } = require("./characterUtil");

async function killPlayers(interaction, deathIds) {
  const guildId = interaction.guild.id;
  const members = interaction.guild.members.cache;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const cursor = await findUsersWithIds(guildId, deathIds);
  const deadUsers = await cursor.toArray();
  const settings = await findSettings(guildId);
  let message = "";

  await Promise.all(
    _.map(deadUsers, async (deadUser) => {
      const deadMember = members.get(deadUser.user_id);
      let isDead = true;

      if (deadUser.character === characters.MUTATED) {
        // join werewolf team
        await updateUser(deadUser.user_id, interaction.guild.id, {
          character: characters.WEREWOLF,
        });
        await giveChannelPermissions({
          interaction,
          user: deadMember,
          character: characters.WEREWOLF,
        });
        await organizedChannels.werewolves.send(
          `${deadMember} did not die and has turned into a werewolf! :wolf:`
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
          `You did not kill ${deadMember} because they are the witch! They have joined the channel`
        );
        isDead = false;
      } else if (deadUser.has_guard) {
        await updateUser(deadUser.user_id, interaction.guild.id, {
          has_guard: false,
        });
        isDead = false;
      }

      if (isDead) {
        message += await werewolfKillDeathMessage({ interaction, deadMember, deadUser })
      }
    })
  );

  return message;
}

module.exports = {
  killPlayers,
};
