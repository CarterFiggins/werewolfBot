const _ = require("lodash");
const {
  findAllUsers,
  findUserScore,
  createUserScore,
  updateUserScore,
} = require("../werewolf_db");
const { createChannel } = require("./channelHelpers");
const { characters } = require("./commandHelpers");
const { roleNames, getRole } = require("./rolesHelpers");

const teams = {
  VILLAGERS: "villagers",
  WEREWOLVES: "werewolves",
  VAMPIRES: "vampires",
};

async function calculateScores(interaction, { winner }) {
  const guildId = interaction.guild.id;
  const cursor = await findAllUsers(guildId);
  const dbUsers = await cursor.toArray();
  const usersPoints = await awardWinners(dbUsers, winner);
  // await displayPoints(interaction, usersPoints);
}

async function awardWinners(dbUsers, winner) {
  return Promise.all(
    _.map(dbUsers, async (dbUser) => {
      if (winner === teams.VILLAGERS) {
        if (
          !dbUser.is_vampire &&
          dbUser.character !== characters.WEREWOLF &&
          dbUser.character !== characters.WITCH
        ) {
          return addPoints(dbUser);
        }
      } else if (winner === teams.WEREWOLVES) {
        if (
          dbUser.character === characters.WEREWOLF ||
          dbUser.character === characters.WITCH
        ) {
          return addPoints(dbUser);
        }
      } else if (winner === teams.VAMPIRES) {
        if (dbUser.is_vampire) {
          return addPoints(dbUser);
        }
      }
      return addPoints(dbUser, 0);
    })
  );
}

async function addPoints({ is_dead, guild_id, user_id }, score = 100) {
  const userScore = await findUserScore({ guild_id, user_id });
  let newPoints = score;

  if (is_dead) {
    newPoints /= 2;
  }

  if (!userScore) {
    await createUserScore({ guild_id, user_id, points: newPoints });
    return { user_id, points: newPoints };
  }

  newPoints += userScore.points;

  await updateUserScore(guild_id, user_id, { points: newPoints });
  return { user_id, points: newPoints };
}

async function displayPoints(interaction, usersPoints) {
  const members = interaction.guild.members.cache;
  const adminRole = await getRole(interaction, roleNames.ADMIN);
  const nonPlayersPermissions = {
    id: interaction.guild.id,
    deny: ["SEND_MESSAGES", "ADD_REACTIONS"],
    allow: ["VIEW_CHANNEL"],
  };
  const adminPermissions = {
    id: adminRole.id,
    allow: ["ADMINISTRATOR"],
  };

  const channelName = "scoreboard";

  const channels = await interaction.guild.channels.fetch();
  let scoreboardChannel = null;

  channels.map(async (channel) => {
    if (channel.name === channelName) {
      scoreboardChannel = channel;
    }
  });

  if (!scoreboardChannel) {
    scoreboardChannel = await createChannel(interaction, channelName, [
      nonPlayersPermissions,
      adminPermissions,
    ]);
  }

  await scoreboardChannel.bulkDelete(10);

  let scores = "**Scoreboard**\n";

  _.forEach(_.orderBy(usersPoints, ["points"], ["desc"]), (userPoints) => {
    const member = members.get(userPoints.user_id);
    scores += `${member}: ${userPoints.points} points\n`;
  });

  scoreboardChannel.send(scores);
}

module.exports = {
  teams,
  calculateScores,
};
