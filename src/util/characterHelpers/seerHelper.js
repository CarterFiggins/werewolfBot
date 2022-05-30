const _ = require("lodash");
const { updateUser, findManyUsers } = require("../../werewolf_db");
const { giveChannelPermissions } = require("../channelHelpers");
const { characters } = require("../commandHelpers");

async function shuffleSeers(interaction, organizedChannels) {
  const guildId = interaction.guild.id;
  const apprenticeSeers = await (
    await findManyUsers({
      guild_id: guildId,
      is_dead: false,
      character: characters.APPRENTICE_SEER,
    })
  ).toArray();

  const fools = await (
    await findManyUsers({
      guild_id: guildId,
      is_dead: false,
      character: characters.FOOL,
    })
  ).toArray();

  if (!_.isEmpty(apprenticeSeers)) {
    const apprenticeSeerUser = _.sample(apprenticeSeers);
    const discordApprenticeUser = interaction.guild.members.cache.get(
      apprenticeSeerUser.user_id
    );

    if (!_.isEmpty(fools)) {
      const seers = await (
        await findManyUsers({
          guild_id: guildId,
          is_dead: false,
          character: characters.SEER,
        })
      ).toArray();

      const rest = [...seers, ...fools];
      const roles = _.shuffle([
        ..._.map(rest, (s) => s.character),
        characters.SEER,
      ]);

      const apprenticeNewRole = roles.pop();
      await updateUser(apprenticeSeerUser.user_id, guildId, {
        character: apprenticeNewRole,
      });

      let roleMessage = `${discordApprenticeUser} is now the ${apprenticeNewRole}\n`;
      let seerChannelMessage = `${discordApprenticeUser}\n`;

      await Promise.all(
        _.map(rest, async (user) => {
          let newRole = roles.pop();

          if (!newRole) {
            newRole = characters.FOOL;
          }

          await updateUser(user.user_id, guildId, {
            character: newRole,
          });

          const discordUser = interaction.guild.members.cache.get(user.user_id);

          roleMessage += `${discordUser} is now the ${newRole}\n`;
          seerChannelMessage += `${discordUser}\n`;
        })
      );

      await organizedChannels.seer.send(
        `${seerChannelMessage}The master seer has died.\nAll the roles have been mixed.\nYou don't know who is who good luck.`
      );
      await organizedChannels.afterLife.send(roleMessage);
    } else {
      await updateUser(apprenticeSeerUser.user_id, guildId, {
        character: characters.SEER,
      });
      await organizedChannels.seer.send(
        `${discordApprenticeUser} the master seer has died and you must take their place`
      );
    }
    await giveChannelPermissions({
      interaction,
      user: discordApprenticeUser,
      character: characters.SEER,
    });
  }
}

module.exports = { shuffleSeers };
