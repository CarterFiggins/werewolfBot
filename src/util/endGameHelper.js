const {
  findUser,
  deleteAllUsers,
  deleteGame,
  deleteManyVotes,
  findGame,
  findOneUser,
} = require("../werewolf_db");
const { organizeChannels } = require("./channelHelpers");
const { characters } = require("./characterHelpers/characterUtil");
const { getAliveMembers } = require("./discordHelpers");
const { removeGameRolesFromMembers } = require("./rolesHelpers");
const { endGuildJobs } = require("./schedulHelper");

async function checkGame(interaction, chaosWins) {
  const members = interaction.guild.members.cache;
  const guildId = interaction.guild.id;
  const roles = interaction.guild.roles.cache;
  const aliveMembers = await getAliveMembers(interaction);

  let werewolfCount = 0;
  let villagerCount = 0;
  let vampireCount = 0;
  let witchCount = 0;

  await Promise.all(
    aliveMembers.map(async (member) => {
      const dbUser = await findUser(member.user.id, guildId);
      if (dbUser.character === characters.WEREWOLF) {
        werewolfCount += 1;
      } else if (dbUser.is_vampire) {
        vampireCount += 1;
      } else if (dbUser.character === characters.WITCH) {
        witchCount += 1;
      } else {
        villagerCount += 1;
      }
    })
  );

  if (werewolfCount > 0) {
    werewolfCount += witchCount;
  }

  const isGameOver = await checkForWinner(interaction, chaosWins, {
    werewolfCount,
    villagerCount,
    vampireCount,
    witchCount,
  });

  if (isGameOver) {
    await endGame(interaction, roles, members);
  }
}

async function checkForWinner(interaction, chaosWins, counts) {
  const { werewolfCount, villagerCount, vampireCount, witchCount } = counts
  const game = await findGame(interaction.guild.id);
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);

  if (chaosWins) {
    const members = interaction.guild.members.cache;
    const chaosDemon = await findOneUser({
      guild_id: interaction.guild.id,
      character: characters.CHAOS_DEMON
    });
    const chaosDemonMember = members.get(chaosDemon.user_id)
      
    await organizedChannels.townSquare.send(
      `# Chaos Demon Victory!
The player you lynched was the Chaos Demon's marked target!
As a result, the village is plunged into chaos, and everyone loses... except for ${chaosDemonMember} the devious Chaos Demon
      `
    );
    return true
  }

  if (villagerCount === 0 && werewolfCount === vampireCount && game.is_day) {
    return false;
  }

  if (werewolfCount === 0 && vampireCount === 0 && villagerCount === 0 && witchCount === 0) {
    await organizedChannels.townSquare.send(
      "# I WIN! Everyone is dead!"
    );
    return true;
  }
  
  if (werewolfCount === 0 && vampireCount === 0) {
    await organizedChannels.townSquare.send(
      `# Villagers Win!
      There are no more werewolves or vampires.`
    );
     return true;
  }
  
  if (werewolfCount >= villagerCount + vampireCount) {
    await organizedChannels.townSquare.send(
      `# Werewolves Win!
      Werewolves out number the villagers and vampires.`
    );
     return true;
  }
  
  if (vampireCount >= villagerCount + werewolfCount) {
    await organizedChannels.townSquare.send(
      `# Vampires Win!
      Vampires out number the villagers and werewolves.`
    );
    return true;
  }
  
  return false;
}

async function endGame(interaction, roles, members) {
  const guildId = interaction.guild.id;
  // remove all discord roles from players
  await removeGameRolesFromMembers(members, roles);

  // delete all game info from database
  await deleteAllUsers(guildId);
  await deleteGame(guildId);
  await deleteManyVotes({ guild_id: guildId });
  await endGuildJobs(interaction);
}

module.exports = {
  checkGame,
};
