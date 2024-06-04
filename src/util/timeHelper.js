require("dotenv").config();
const _ = require("lodash");
const schedule = require("node-schedule");
const { organizeChannels } = require("./channelHelpers");
const { organizeRoles, getRole, roleNames } = require("./rolesHelpers");
const {
  findGame,
  updateGame,
  findUser,
  getCountedVotes,
  deleteManyVotes,
  findSettings,
} = require("../werewolf_db");
const { vampiresAttack } = require("./characterHelpers/vampireHelpers");
const { parseSettingTime } = require("./checkTime");
const { endGuildJobs } = require("./schedulHelper");
const { copyCharacters } = require("./characterHelpers/doppelgangerHelper");
const { starveUser } = require("./characterHelpers/bakerHelper");
const { checkGame } = require("./endGameHelper");
const { removesDeadPermissions, votingDeathMessage } = require("./deathHelper");
const { guardPlayers } = require("./characterHelpers/bodyguardHelper");
const {
  cursePlayers,
} = require("./characterHelpers/witchHelper");
const { killPlayers } = require("./characterHelpers/werewolfHelper");
const { returnMutedPlayers, mutePlayers } = require("./characterHelpers/grouchyGranny");
const { investigatePlayers } = require("./characterHelpers/seerHelper");

async function timeScheduling(interaction) {
  await endGuildJobs(interaction);
  const game = await findGame(interaction.guild.id);
  if (!game) {
    await interaction.reply({
      content: "No game to schedule",
      ephemeral: true,
    });
    return;
  }

  const settings = await findSettings(interaction.guild.id);

  if (!settings) {
    await interaction.reply({
      content: "run server setup",
      ephemeral: true,
    });
    return;
  }

  const day = parseSettingTime(settings.day_time);
  const night = parseSettingTime(settings.night_time);

  let warningHour = night.hour;
  let warningMinute = night.minute - 30;

  if (warningMinute < 0) {
    warningMinute = 60 + warningMinute;
    warningHour -= 1;
    if (warningHour < 0) {
      warningHour = 23;
    }
  }

  const nightRule = new schedule.RecurrenceRule();
  const dayRule = new schedule.RecurrenceRule();
  const warningRule = new schedule.RecurrenceRule();
  nightRule.minute = night.minute;
  nightRule.hour = night.hour;
  nightRule.tz = process.env.TIME_ZONE_TZ;
  dayRule.minute = day.minute;
  dayRule.hour = day.hour;
  dayRule.tz = process.env.TIME_ZONE_TZ;
  warningRule.minute = warningMinute;
  warningRule.hour = warningHour;
  warningRule.tz = process.env.TIME_ZONE_TZ;
  console.log(`creating ${interaction.guild.id}-night`);
  schedule.scheduleJob(`${interaction.guild.id}-night`, nightRule, () =>
    nightTimeJob(interaction)
  );
  console.log(`creating ${interaction.guild.id}-day`);
  schedule.scheduleJob(`${interaction.guild.id}-day`, dayRule, () =>
    dayTimeJob(interaction)
  );
  console.log(`creating ${interaction.guild.id}-warning`);
  schedule.scheduleJob(`${interaction.guild.id}-warning`, warningRule, () =>
    nightTimeWarning(interaction)
  );
  return true;
}

async function nightTimeWarning(interaction) {
  const guildId = interaction.guild.id;
  const game = await findGame(guildId);
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);
  const aliveRole = await getRole(interaction, roleNames.ALIVE);
  if (game.first_night) {
    await organizedChannels.townSquare.send(
      `${aliveRole} This is the first night. Voting will start tomorrow`
    );
    return;
  }
  await organizedChannels.townSquare.send(
    `${aliveRole} 30 minutes until night`
  );
}

// Handles werewolf kill and vampire bites.
async function dayTimeJob(interaction) {
  const guildId = interaction.guild.id;
  const game = await findGame(guildId);

  if (game.is_day) {
    console.log("It is currently day skip");
    return;
  }

  await interaction.guild.members.fetch();
  const roles = await interaction.guild.roles.fetch();
  const organizedRoles = organizeRoles(roles);
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  let message = "";

  await copyCharacters(interaction);
  await cursePlayers(interaction);
  await returnMutedPlayers(interaction, guildId);
  await mutePlayers(interaction, guildId)

  const guardedIds = await guardPlayers(interaction);

  const deathIds = _.difference(
    [game.user_death_id, game.second_user_death_id],
    [...guardedIds, null]
  );
  const vampireDeathMessages = await vampiresAttack(
    interaction,
    deathIds,
    guardedIds
  );

  message += await killPlayers(interaction, deathIds);
  let starveMessage = ""
  if (game.is_baker_dead) {
    starveMessage = await starveUser(interaction, organizedRoles, deathIds);
  }

  await investigatePlayers(interaction)

  await updateGame(guildId, {
    user_death_id: null,
    second_user_death_id: null,
    wolf_double_kill: false,
    is_day: true,
    first_night: false,
  });

  const backUpMessage = "No one died from a werewolf last night.\n";

  await organizedChannels.townSquare.send(
    `${message || backUpMessage}${starveMessage}${vampireDeathMessages}\n**It is day time**`
  );

  await checkGame(interaction);
}

// Handles town votes and death
async function nightTimeJob(interaction) {
  const guildId = interaction.guild.id;
  const members = await interaction.guild.members.fetch();
  const roles = await interaction.guild.roles.fetch();
  const organizedRoles = organizeRoles(roles);
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  const game = await findGame(guildId);

  if (game.first_night) {
    await updateGame(guildId, {
      is_day: false,
    });
    await organizedChannels.werewolves.send(
      "This is the first night. Choose someone to kill with the `/kill` command"
    );
    await organizedChannels.bodyguard.send(
      "This is the first night. Choose someone to guard with the `/guard` command"
    );
    await organizedChannels.seer.send(
      "This is the first night. Choose someone to see with the `/investigate` command"
    );
    await organizedChannels.witch.send(
      "This is the first night. Choose someone to curse with the `/curse` command"
    );
    await organizedChannels.vampires.send(
      "This is the first night. Choose someone to bite with the `/vampire_bite` command"
    );
    return;
  }
  if (!game.is_day) {
    console.log("It is currently night skip");
    return;
  }

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

  const voteWinner = _.sample(topVotes);
  await deleteManyVotes({ guild_id: guildId });
  if (!voteWinner) {
    await updateGame(guildId, {
      is_day: false,
    });
    await organizedChannels.townSquare.send("No one has voted...\nIt is night");
    return;
  }
  const deadUser = await findUser(voteWinner._id.voted_user_id, guildId);
  const deadMember = members.get(voteWinner._id.voted_user_id);

  const deathCharacter = await removesDeadPermissions(
    interaction,
    deadUser,
    deadMember,
    organizedRoles
  );
  await votingDeathMessage({ interaction, deathCharacter, deadMember, deadUser, topVotes })
  await checkGame(interaction);
}

module.exports = {
  timeScheduling,
  dayTimeJob,
  nightTimeJob,
};
