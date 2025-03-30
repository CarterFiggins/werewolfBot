const _ = require("lodash");
const { updateUser, findManyUsers, findUser } = require("../../werewolf_db");
const { organizeChannels } = require("../channelHelpers");
const { characters } = require("./characterUtil");

async function cursePlayers(interaction) {
  const guildId = interaction.guild.id;
  const members = interaction.guild.members.cache;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const cursorWitches = await findManyUsers({
    guild_id: guildId,
    character: characters.WITCH,
  });
  const witches = await cursorWitches.toArray();

  if (_.isEmpty(witches)) {
    return;
  }

  await Promise.all(
    _.map(witches, async (witch) => {
      if (witch.target_cursed_user_id) {
        const targetDbUser = await findUser(witch.target_cursed_user_id, guildId)
        if (targetDbUser.is_dead) {
          await updateUser(witch.target_cursed_user_id, guildId, {
            is_cursed: false,
          });
          await organizedChannels.witch.send(
            `${members.get(witch.user_id)} Your dark magic has failed. ${members.get(witch.target_cursed_user_id)} has died and this curse works on the living.`
          );
          return;
        }
        await updateUser(witch.target_cursed_user_id, guildId, {
          is_cursed: true,
        });
        await updateUser(witch.user_id, guildId, {
          target_cursed_user_id: null,
        });
        await organizedChannels.witch.send(
          `${members.get(witch.user_id)} Your dark magic has taken effect. You have successfully cursed ${members.get(witch.target_cursed_user_id)}. The power of your curse now looms over them.`
        );
      }
    })
  );

  const cursorCursed = await findManyUsers({
    guild_id: guildId,
    is_cursed: true,
    is_dead: false,
  });
  const cursedUser = await cursorCursed.toArray();
  if (!_.isEmpty(cursedUser)) {
    await organizedChannels.witch.send(
      `Current players cursed\n${_.map(cursedUser, (user) => `* ${members.get(user.user_id)}`).join("\n")}`
    );
  }
}

module.exports = {
  cursePlayers,
};
