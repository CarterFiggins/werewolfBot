const _ = require("lodash");
const { updateUser, findManyUsers, findUser, updateGame } = require("../../werewolf_db");
const { characters } = require("./characterUtil");
const { sendMemberMessage } = require("../botMessages/sendMemberMessages");
const { powerUpMessages } = require("../commandHelpers");
const { organizeChannels } = require("../channelHelpers");

async function givePower(interaction) {
  const cursorMonarchs = await findManyUsers({
    guild_id: interaction.guild.id,
    is_dead: false,
    character: characters.MONARCH,
  });
  const monarchs = await cursorMonarchs.toArray()
  const members = interaction.guild.members.cache;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);

  for (const monarch of monarchs) {
    if (monarch.giving_user_id === 'bot') {
      await updateGame(interaction.guild.id, {
        bot_has_gun: true,
      });
      monarch.given_power_ups.push(monarch.giving_power)
      monarch.given_to_user_ids.push(monarch.giving_user_id)
      await updateUser(monarch.user_id, interaction.guild.id, {
        giving_user_id: null,
        giving_power: null,
        given_power_ups: monarch.given_power_ups,
        given_to_user_ids: monarch.given_to_user_ids,
      });
      organizedChannels.monarch.send(`${monarchMember} thank you for the gun :)`)
    } else if (monarch.giving_user_id) {
      const targetMember = members.get(monarch.giving_user_id)
      const monarchMember = members.get(monarch.user_id)
      const targetDbUser = findUser(monarch.giving_user_id, interaction.guild.id)
      if (!targetDbUser.is_dead) {
        if (!targetDbUser.power_ups) {
          targetDbUser.power_ups = {}
        }
        targetDbUser.power_ups[monarch.giving_power] = true
        await updateUser(monarch.giving_user_id, interaction.guild.id, {
          power_ups: targetDbUser.power_ups,
        });
        await sendMemberMessage(targetMember, `You have been given a Power Up! ${powerUpMessages.get(monarch.giving_power)}`)
        organizedChannels.monarch.send(`${monarchMember} you have successfully given ${targetMember} the power ${monarch.giving_power}`)
        organizedChannels.afterLife.send(`The monarch ${monarchMember} send the power ${monarch.giving_power} to ${targetMember}`)
      }
      monarch.given_power_ups.push(monarch.giving_power)
      monarch.given_to_user_ids.push(monarch.giving_user_id)
      await updateUser(monarch.user_id, interaction.guild.id, {
        giving_user_id: null,
        giving_power: null,
        given_power_ups: monarch.given_power_ups,
        given_to_user_ids: monarch.given_to_user_ids,
      });
    }
  }
}

module.exports = {
  givePower,
};
