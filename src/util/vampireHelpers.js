const _ = require("lodash");
const { findUser, findManyUsers, updateUser } = require("../werewolf_db");
const { characters, addVampireBitePermissions } = require("./commandHelpers");
const { organizeRoles } = require("./rolesHelpers");
const {
  giveVampireChannelPermissions,
  organizeChannels,
} = require("./channelHelpers");

async function vampiresAttack(
  interaction,
  werewolfKillIds,
  removesDeadPermissions
) {
  const members = await interaction.guild.members.fetch();
  const allRoles = await interaction.guild.roles.fetch();
  const organizedRoles = await organizeRoles(allRoles);
  const guildId = interaction.guild.id;
  const cursor = await findManyUsers({
    guild_id: guildId,
    is_vampire: true,
    death: false,
  });
  const vampires = await cursor.toArray();

  const vampireDeathMessages = [];

  await Promise.all(
    _.map(vampires, async (vampire) => {
      const victim = await findUser(vampire.bite_user_id, guildId);
      const victimMember = members.get(vampire.bite_user_id);
      const vampireMember = members.get(vampire.user_id);
      const successfulBite = await bitePlayer(victim, guildId);
      const werewolfAttacked = _.includes(
        werewolfKillIds,
        vampire.bite_user_id
      );
      const vampireKilled = _.includes(werewolfKillIds, vampire.user_id);
      if (!victim.is_vampire && !vampireKilled) {
        if (successfulBite && !werewolfAttacked) {
          if (successfulBite >= 2) {
            await transformIntoVampire(interaction, victim, victimMember);
          }
        } else {
          await removesDeadPermissions(
            interaction,
            vampire,
            vampireMember,
            organizedRoles
          );
          if (werewolfAttacked) {
            vampireDeathMessages.push(
              `The vampire named ${vampireMember} died while in the way of the werewolves killing ${victimMember}\nhttps://tenor.com/blRya.gif\n`
            );
          } else {
            vampireDeathMessages.push(
              `The vampire named ${vampireMember} tried to suck blood from a werewolf and died\nhttps://tenor.com/sJlV.gif\n`
            );
          }
        }
      }
    })
  );
  return vampireDeathMessages.join();
}

async function transformIntoVampire(interaction, user, userMember) {
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  await updateUser(user.user_id, interaction.guild.id, {
    is_vampire: true,
  });

  await addVampireBitePermissions(interaction, user);
  await giveVampireChannelPermissions(interaction, userMember);
  await organizedChannels.vampires.send(
    `${userMember} has turned into a vampire!`
  );
}

async function bitePlayer(user, guildId) {
  if (user.character === characters.WEREWOLF) {
    return false;
  }
  await updateUser(user.user_id, guildId, {
    vampire_bites: user.vampire_bites + 1,
  });
  return user.vampire_bites + 1;
}

module.exports = {
  transformIntoVampire,
  bitePlayer,
  vampiresAttack,
};
