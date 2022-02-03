require("dotenv").config();
const _ = require("lodash");
const schedule = require("node-schedule");
const { organizeChannels } = require("./channelHelpers");
const { organizeRoles } = require("./rolesHelpers");
const {
  removeUsersPermissions,
  resetNightPowers,
} = require("./commandHelpers");
const {
  findGame,
  updateGame,
  findUser,
  getCountedVotes,
  deleteAllVotes,
} = require("../werewolf_db");

async function timeScheduling(interaction, dayHour, nightHour) {
  await schedule.gracefulShutdown();
  const nightRule = new schedule.RecurrenceRule();
  const dayRule = new schedule.RecurrenceRule();
  nightRule.minute = 0;
  nightRule.hour = nightHour;
  nightRule.tz = process.env.TIME_ZONE_TZ;
  dayRule.minute = 0;
  dayRule.hour = dayHour;
  dayRule.tz = process.env.TIME_ZONE_TZ;
  schedule.scheduleJob(nightRule, () => nightTimeJob(interaction));
  schedule.scheduleJob(dayRule, () => dayTimeJob(interaction));

  // TODO: remove TESTING
  // schedule.scheduleJob(
  //   "2,6,10,14,18,22,26,30,34,38,42,46,50,54,58 * * * *",
  //   () => nightTimeJob(interaction)
  // );
  // schedule.scheduleJob(
  //   "0,4,8,12,16,20,24,28,32,36,40,44,48,52,56 * * * *",
  //   () => dayTimeJob(interaction)
  // );
}
// TODO: if bodyguard does not guard set last guard id to null
// Handles werewolf kill.
async function dayTimeJob(interaction) {
  const guildId = interaction.guild.id;
  const client = interaction.guild.client;
  const members = await interaction.guild.members.fetch();
  const roles = await interaction.guild.roles.fetch();
  const users = client.users.cache;
  const organizedRoles = organizeRoles(roles);
  const channels = client.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const game = await findGame(guildId);

  if (game.is_day) {
    console.log("It is currently day skip");
    return;
  }
  let message = "No one die last night";

  if (game.user_death_id) {
    if (
      game.user_death_id !== game.user_protected_id &&
      game.user_death_id !== game.user_guarded_id
    ) {
      const deadUser = await findUser(game.user_death_id, guildId);
      const member = members.get(game.user_death_id);
      member.roles.remove(organizedRoles.alive);
      member.roles.add(organizedRoles.dead);
      const discordUser = users.get(game.user_death_id);
      // TODO: add a script for each character death?
      // TODO: add check to see if it was the hunter who died
      message = `Last night the ${deadUser.character} named ${discordUser} was killed by the werewolves.`;
    }
  }

  await updateGame(guildId, {
    user_death_id: null,
    user_protected_id: null,
    user_guarded_id: null,
    is_day: true,
    first_night: false,
  });

  organizedChannels.townSquare.send(`${message}\n It is day time`);
  //TODO: check if game is over!
}

// Handles town votes and death
async function nightTimeJob(interaction) {
  const guildId = interaction.guild.id;
  const client = interaction.guild.client;
  const members = await interaction.guild.members.fetch();
  const roles = await interaction.guild.roles.fetch();
  const users = client.users.cache;
  const organizedRoles = organizeRoles(roles);
  const channels = await client.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const game = await findGame(guildId);

  if (game.first_night) {
    await updateGame(guildId, {
      is_day: false,
    });
    organizedChannels.werewolves.send(
      "This is the first night. Choose someone to kill with the `/kill` command"
    );
    return;
  }
  if (!game.is_day) {
    console.log("It is currently night skip");
    return;
  }
  let message;

  const cursor = await getCountedVotes(guildId);
  const allVotes = await cursor.toArray();

  let topVotes = [];
  let topCount = 0;

  _.forEach(allVotes, (vote) => {
    if (vote.count >= topCount) {
      topVotes.push(vote);
      topCount = vote.count;
    }
  });

  let killedRandomly = false;
  if (topVotes.length > 1) {
    killedRandomly = true;
  }
  const voteWinner = _.head(_.shuffle(topVotes));

  await deleteAllVotes(guildId);
  await resetNightPowers(users, guildId);
  if (!voteWinner) {
    await updateGame(guildId, {
      is_day: false,
    });
    organizedChannels.townSquare.send("No one has voted...\nIt is night");
    return;
  }
  const deadUser = await findUser(voteWinner._id.voted_user_id, guildId);
  member = members.get(voteWinner._id.voted_user_id);
  member.roles.remove(organizedRoles.alive);
  member.roles.add(organizedRoles.dead);
  const discordUser = users.get(voteWinner._id.voted_user_id);
  // removes deadUser character command Permissions
  await removeUsersPermissions(interaction, deadUser);

  // TODO: add a script for each character death?
  // TODO: add check to see if it was the hunter who died

  if (killedRandomly) {
    message = `There was a tie so I randomly picked ${discordUser} to die`;
  } else {
    message = `The town has decided to hang ${discordUser}`;
  }
  const deathMessage = `The town has killed a ${deadUser.character}`;
  await updateGame(guildId, {
    is_day: false,
  });

  organizedChannels.townSquare.send(
    `${message}\n${deathMessage}\n It is night time`
  );
  //TODO: check if game is over!
}

module.exports = {
  timeScheduling,
};
