const {
  findUser,
  deleteAllUsers,
  deleteGame,
  deleteManyVotes,
} = require("../werewolf_db");
const { organizeChannels } = require("./channelHelpers");
const { characters } = require("./commandHelpers");
const { getAliveMembers } = require("./discordHelpers");
const { removeGameRolesFromMembers } = require("./rolesHelpers");
const { endGuildJobs } = require("./schedulHelper");
const { calculateScores, teams } = require("./scoreSystem");

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

  await Promise.all(
    aliveMembers.map(async (member) => {
      const dbUser = await findUser(member.user.id, guildId);
      if (
        dbUser.character === characters.WEREWOLF ||
        dbUser.character === characters.WITCH
      ) {
        werewolfCount += 1;
      } else if (dbUser.is_vampire) {
        vampireCount += 1;
      } else {
        villagerCount += 1;
      }
    })
  );

  let isGameOver = false;
  let winner;

  if (werewolfCount === 0 && vampireCount === 0) {
    organizedChannels.townSquare.send(
      "There are no more werewolves or vampires. **Villagers Win!**"
    );
    isGameOver = true;
    winner = teams.VILLAGERS;
  } else if (werewolfCount >= villagerCount + vampireCount) {
    organizedChannels.townSquare.send(
      "Werewolves out number the villagers and vampires. **Werewolves Win!**"
    );
    isGameOver = true;
    winner = teams.WEREWOLVES;
  } else if (vampireCount >= villagerCount + werewolfCount) {
    organizedChannels.townSquare.send(
      "Vampires out number the villagers and werewolves. **Vampires Win!**"
    );
    isGameOver = true;
    winner = teams.VAMPIRES;
  }

  const scoreData = { winner };

  if (isGameOver) {
    await endGame(interaction, roles, members, scoreData);
  }
}

async function endGame(interaction, roles, members, scoreData) {
  const guildId = interaction.guild.id;
  // remove all discord roles from players
  await removeGameRolesFromMembers(members, roles);

  await calculateScores(interaction, scoreData);

  // delete all game info from database
  await deleteAllUsers(guildId);
  await deleteGame(guildId);
  await deleteManyVotes({ guild_id: guildId });
  await endGuildJobs(interaction);
}

module.exports = {
  checkGame,
};
