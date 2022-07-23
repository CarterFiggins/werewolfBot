const _ = require("lodash");
const { findUsersWithIds, updateUser } = require("../../werewolf_db");
const {
  giveChannelPermissions,
  organizeChannels,
} = require("../channelHelpers");
const { characters } = require("../commandHelpers");
const { removesDeadPermissions } = require("../deathHelper");
const { organizeRoles } = require("../rolesHelpers");

async function killPlayers(interaction, deathIds) {
  const guildId = interaction.guild.id;
  const members = interaction.guild.members.cache;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const roles = interaction.guild.roles.cache;
  const organizedRoles = organizeRoles(roles);
  const cursor = await findUsersWithIds(guildId, deathIds);
  const deadUsers = await cursor.toArray();
  let message = "";

  await Promise.all(
    _.map(deadUsers, async (deadUser) => {
      const deadMember = members.get(deadUser.user_id);
      let isDead = true;

      if (deadUser.character === characters.CURSED) {
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
      } else if (deadUser.character === characters.WITCH) {
        organizedChannels.werewolves.send(
          `You did not kill ${deadMember} because they are the witch!`
        );
        isDead = false;
      }

      if (isDead) {
        const deathCharacter = await removesDeadPermissions(
          interaction,
          deadUser,
          deadMember,
          organizedRoles
        );
        if (deadUser.character === characters.HUNTER) {
          message += `Last night the werewolves injured the **${deathCharacter}**\n${deadMember} you don't have long to live. Grab your gun and \`/shoot\` someone.\n`;
        } else {
          message += `Last night the **${deathCharacter}** named ${deadMember} was killed by the werewolves.\n`;
        }
      }
    })
  );

  return message;
}

module.exports = {
  killPlayers,
};
