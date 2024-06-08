const _ = require("lodash");
const { findUsersWithIds, updateUser, findSettings, findManyUsers } = require("../../werewolf_db");
const {
  giveChannelPermissions,
  organizeChannels,
} = require("../channelHelpers");
const { characters } = require("./characterUtil");
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
        organizedChannels.werewolves.send(
          `You went after ${deadMember} last night, but guess what? ${deadMember} was the witch, and your attack didn't quite go as planned. The twist? The witch has now joined your chat!\nWelcome, ${deadMember}! The hunt just got a little more magical.`
        );
        isDead = false;
      } else if (deadUser.has_guard) {
        await organizedChannels.werewolves.send(
          `${deadMember} is a lycan! It turns out they were tougher than you expected! Your attack was unsuccessful this time. However, now you know what you’re up against, and next time you’ll be prepared to take them down.`
        );
        await updateUser(deadUser.user_id, interaction.guild.id, {
          has_guard: false,
        });
        isDead = false;
      }

      if (isDead) {
        const deathCharacter = await removesDeadPermissions(
          interaction,
          deadUser,
          deadMember,
          organizedRoles,
          settings.hunter_guard
        );
        if (deadUser.character === characters.HUNTER && settings.hunter_guard) {
          const cursorWerewolf = await findManyUsers({
            guild_id: interaction.guild.id,
            character: characters.WEREWOLF,
          });
          const werewolves = await cursorWerewolf.toArray();
          const deadWerewolf = _.sample(werewolves)
          const deadWerewolfMember = members.get(deadWerewolf.user_id);
          const deadWerewolfCharacter = await removesDeadPermissions(
            interaction,
            deadWerewolf,
            deadWerewolfMember,
            organizedRoles,
          );
          message += `Last night the werewolves killed the **${deathCharacter}**\n Before ${deadMember} died they were able to kill the ${deadWerewolfCharacter} named ${deadWerewolfMember}\n`;
        } else if (deadUser.character === characters.HUNTER) { 
           message += `Last night, the werewolves attacked and injured the **${deathCharacter}**, ${deadMember}. Despite their injuries, the hunter has one last chance to fight back. ${deadMember} now has the opportunity to shoot any player with their gun before succumbing to their wounds.\nChoose wisely, ${deadMember}. The fate of the village may rest on your final shot.\n`;
        } else {
          message += `Last night, the werewolves struck again. ${deadMember}, who played the role of ${deathCharacter}, has been killed by the attack.\n`;
        }
      }
    })
  );

  return message;
}

module.exports = {
  killPlayers,
};
