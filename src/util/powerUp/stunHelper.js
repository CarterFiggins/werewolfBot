const _ = require("lodash");
const { updateManyUsers, updateUser, deleteManyVotes } = require("../../werewolf_db");

async function removeNightPowerForUser(interaction, dbUser) {
  const updatedUser = {
    kill_targeted_user_ids: [],
    guarded_user_id: null,
    bite_user_id: null,
    giving_user_id: null,
    giving_power: null,
    investigateUserId: null,
    target_cursed_user_id: null,
    muteUserId: null,
  }


  await updateUser(dbUser.user_id, interaction.guild.id, updatedUser)
}

async function removeVotesFromStun(guildId, userId) {
  await deleteManyVotes({
    guild_id: guildId,
    user_id: userId,
  });
}

async function removeStunnedUsers(interaction) {
  await updateManyUsers(
    {
      guild_id: interaction.guild.id,
      is_stunned: true,
    },
    {
      is_stunned: false,
    }
  );
}

module.exports = {
  removeNightPowerForUser,
  removeStunnedUsers,
  removeVotesFromStun,
};
