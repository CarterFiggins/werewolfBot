const {
  findUser,
  deleteAllUsers,
  deleteGame,
  deleteManyVotes,
  findGame,
} = require("../werewolf_db");
const { organizeChannels } = require("./channelHelpers");
const { characters } = require("./characterHelpers/characterUtil");
const { getAliveMembers } = require("./discordHelpers");
const { removeGameRolesFromMembers } = require("./rolesHelpers");
const { endGuildJobs } = require("./schedulHelper");

async function checkGame(interaction) {
  const members = interaction.guild.members.cache;
  const guildId = interaction.guild.id;
  const roles = interaction.guild.roles.cache;
  const aliveMembers = await getAliveMembers(interaction);
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);

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

  const game = await findGame(guildId);

  let isGameOver = false;
  let winner;

  if (villagerCount === 0 && werewolfCount === vampireCount && game.is_day) {
  } else if (werewolfCount === 0 && vampireCount === 0 && villagerCount === 0 && witchCount === 0) {
    await organizedChannels.townSquare.send(
      "# I WIN! Everyone is dead!"
    );
    isGameOver = true;
  } else if (werewolfCount === 0 && vampireCount === 0) {
    await organizedChannels.townSquare.send(
      `# Villagers Win!
      There are no more werewolves or vampires.`
    );
    isGameOver = true;
    winner = teams.VILLAGERS;
  } else if (werewolfCount >= villagerCount + vampireCount) {
    await organizedChannels.townSquare.send(
      `# Werewolves Win!
      Werewolves out number the villagers and vampires.`
    );
    isGameOver = true;
    winner = teams.WEREWOLVES;
  } else if (vampireCount >= villagerCount + werewolfCount) {
    await organizedChannels.townSquare.send(
      `# Vampires Win!
      Vampires out number the villagers and werewolves.`
    );
    isGameOver = true;
    winner = teams.VAMPIRES;
  }

  const scoreData = { winner };

  if (isGameOver) {
    await endGame(interaction, roles, members, scoreData);
  }
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
