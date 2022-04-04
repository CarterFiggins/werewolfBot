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
  guardedIds,
  removesDeadPermissions
) {
  const members = await interaction.guild.members.fetch();
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  const allRoles = await interaction.guild.roles.fetch();
  const organizedRoles = await organizeRoles(allRoles);
  const guildId = interaction.guild.id;
  const cursor = await findManyUsers({
    guild_id: guildId,
    is_vampire: true,
    is_dead: false,
  });
  const vampires = await cursor.toArray();

  usersBittenById = new Map();

  const vampireDeathMessages = await Promise.all(
    _.map(vampires, async (vampire) => {
      if (!vampire.bite_user_id) {
        return null;
      }

      const victim = await findUser(vampire.bite_user_id, guildId);
      const victimMember = members.get(vampire.bite_user_id);
      const vampireMember = members.get(vampire.user_id);
      const isVampireKing = vampire.character === characters.VAMPIRE;

      await updateUser(vampire.user_id, guildId, { bite_user_id: null });

      let biteCount = usersBittenById.get(victim.user_id);

      if (!biteCount) {
        usersBittenById.set(victim.user_id, victim.vampire_bites);
        biteCount = victim.vampire_bites;
      }

      const guarded = _.includes(guardedIds, vampire.bite_user_id);

      const protectedMemberMessage = `${vampireMember} you were not able to bite ${victimMember}. They must have been protected or are able to defend your attacks.`;

      if (
        victim.character === characters.WITCH ||
        victim.character === characters.BODYGUARD ||
        guarded
      ) {
        await organizedChannels.vampires.send(protectedMemberMessage);
        if (guarded) {
          await organizedChannels.bodyguard.send(
            `While guarding ${victimMember} you saw a vampire about to attack!\nUsing your vampire hunting skills you scared away the vampire.\n${vampireMember} is a vampire!`
          );
        }
        return null;
      }

      const werewolfAttacked = _.includes(
        werewolfKillIds,
        vampire.bite_user_id
      );
      const vampireKilled = _.includes(werewolfKillIds, vampire.user_id);
      if (!victim.is_vampire && !vampireKilled) {
        if (bitePlayer(victim) && !werewolfAttacked) {
          biteCount += 1;
          usersBittenById.set(victim.user_id, biteCount);
          if (biteCount >= 2) {
            await transformIntoVampire(interaction, victim, victimMember);
          }
        } else {
          if (isVampireKing) {
            organizedChannels.vampires.send(protectedMemberMessage);
          } else {
            await removesDeadPermissions(
              interaction,
              vampire,
              vampireMember,
              organizedRoles
            );
            if (werewolfAttacked) {
              return `The vampire named ${vampireMember} died while in the way of the werewolves killing ${victimMember}\nhttps://tenor.com/blRya.gif\n`;
            } else {
              return `The vampire named ${vampireMember} tried to suck blood from a werewolf and died\nhttps://tenor.com/sJlV.gif\n`;
            }
          }
        }
      }
    })
  );

  for (const [userId, bites] of usersBittenById.entries()) {
    await updateUser(userId, guildId, { vampire_bites: bites });
  }

  return _.compact(vampireDeathMessages).join();
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

async function bitePlayer(user) {
  if (user.character === characters.WEREWOLF) {
    return false;
  }
  return true;
}

module.exports = {
  transformIntoVampire,
  bitePlayer,
  vampiresAttack,
};
