require("dotenv").config();
const _ = require("lodash");
const schedule = require("node-schedule");
const { organizeChannels } = require("./channelHelpers");
const { getRole, roleNames } = require("./rolesHelpers");
const {
  findGame,
  updateGame,
  findSettings,
  resetUserWhisperCount,
  findManyUsers,
} = require("../werewolf_db");
const { vampiresAttack } = require("./characterHelpers/vampireHelpers");
const { parseSettingTime } = require("./checkTime");
const { endGuildJobs } = require("./schedulHelper");
const { copyCharacters } = require("./characterHelpers/doppelgangerHelper");
const { starveUser } = require("./characterHelpers/bakerHelper");
const { checkGame } = require("./endGameHelper");
const { botShoots } = require("./deathHelper");
const { guardPlayers, sendSuccessfulGuardMessage } = require("./characterHelpers/bodyguardHelper");
const {
  cursePlayers,
} = require("./characterHelpers/witchHelper");
const { killPlayers, getKillTargetedUsers } = require("./characterHelpers/werewolfHelper");
const { returnMutedPlayers, mutePlayers } = require("./characterHelpers/grouchyGranny");
const { investigatePlayers } = require("./characterHelpers/seerHelper");
const { votingDeathMessage } = require("./botMessages/deathMessages");
const { markChaosTarget, getChaosWinIds } = require("./characterHelpers/chaosDemonHelpers");
const { givePower } = require("./characterHelpers/monarchHelper");
const { characters } = require("./commandHelpers");
const { handleHangingVotes } = require("./voteHelpers");
const { removeStunnedUsers } = require("./powerUp/stunHelper");
const { shootCupidsArrows } = require("./characterHelpers/cupidHelper");

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
  const { minute: warningMinute, hour: warningHour } = warningTime(night.hour, night.minute - 30)
  const { minute: killReminderMinute, hour: killReminderHour } = warningTime(night.hour, night.minute + 30)

  const nightRule = createScheduleRule(night.hour, night.minute) 
  const dayRule = createScheduleRule(day.hour, day.minute) 
  const voteWarningRule = createScheduleRule(warningHour, warningMinute) 
  const killReminderRule = createScheduleRule(killReminderHour, killReminderMinute) 

  console.log(`creating ${interaction.guild.id}-night`);
  schedule.scheduleJob(`${interaction.guild.id}-night`, nightRule, () =>
    nightTimeJob(interaction)
  );
  console.log(`creating ${interaction.guild.id}-day`);
  schedule.scheduleJob(`${interaction.guild.id}-day`, dayRule, () =>
    dayTimeJob(interaction)
  );
  console.log(`creating ${interaction.guild.id}-voting-warning`);
  schedule.scheduleJob(`${interaction.guild.id}-voting-warning`, voteWarningRule, () =>
    nightTimeWarning(interaction)
  );
  console.log(`creating ${interaction.guild.id}-kill-reminder`);
  schedule.scheduleJob(`${interaction.guild.id}-kill-reminder`, killReminderRule, () =>
    killReminder(interaction)
  );
  return true;
}

async function killReminder(interaction) {
  const guildId = interaction.guild.id;
  const cursorWerewolves = await findManyUsers({
    guild_id: guildId,
    is_dead: false,
    character: characters.WEREWOLF,
  });
  const werewolves = await cursorWerewolves.toArray();
  if (_.isEmpty(werewolves)) {
    return;
  }

  const noTargetSelected = _.every(werewolves, (wolf) => _.isEmpty(wolf.kill_targeted_user_ids))
  const hasDoubleTargetSelected = _.some(werewolves, (wolf) => wolf.kill_targeted_user_ids?.length >= 2)

  const game = await findGame(guildId);
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  const aliveRole = await getRole(interaction, roleNames.ALIVE);
  if (game.wolf_double_kill && !hasDoubleTargetSelected) {
    return organizedChannels?.werewolves?.send(
      `${aliveRole} You've got a double serving on the menu tonight! But don't just feast on one unlucky soul, pick another before the moon sets. We wouldn't want you to miss out on dessert, would we? Use the \`/kill\` command again to select the second target`
    )
  }
  if (noTargetSelected) {
    return organizedChannels?.werewolves?.send(
      `${aliveRole} it's dinnertime! We wouldn't want any hangry werewolves roaming the village, now would we? It's time to pick your prey and satisfy those growling stomachs. Happy hunting!`
    )
  }
}

async function nightTimeWarning(interaction) {
  const guildId = interaction.guild.id;
  const game = await findGame(guildId);
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  const aliveRole = await getRole(interaction, roleNames.ALIVE);
  if (game.first_night) {
    await organizedChannels.townSquare.send(
      `## ${aliveRole} This is the first night. Voting will start tomorrow`
    );
    return;
  }
  await organizedChannels.townSquare.send(
    `## ${aliveRole} 30 minutes until night`
  );
}

// Handles werewolf kill and vampire bites.
async function dayTimeJob(interaction) {
  const guildId = interaction.guild.id;
  const game = await findGame(guildId);
  // collect messages as players die
  interaction.townAnnouncements = [];

  if (game.is_day) {
    console.log("It is currently day skip");
    return;
  }

  await interaction.guild.members.fetch();

  if (game.first_night) {
    await markChaosTarget(interaction);
  }

  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  let message = "";

  await copyCharacters(interaction);
  await shootCupidsArrows(interaction);

  const guardedIds = await guardPlayers(interaction);
  const werewolfKills = await getKillTargetedUsers(interaction);
  const successfulGuardIds = _.intersection(werewolfKills, guardedIds)
  await sendSuccessfulGuardMessage(interaction, successfulGuardIds)
  const deathIds = _.difference(
    werewolfKills,
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
    starveMessage = await starveUser(interaction, deathIds);
  }

  if (game.bot_has_gun) {
    await botShoots(interaction);
  }

  await cursePlayers(interaction);
  await returnMutedPlayers(interaction, guildId);
  await investigatePlayers(interaction)
  await givePower(interaction)
  await mutePlayers(interaction, guildId)
  await removeStunnedUsers(interaction)

  await updateGame(guildId, {
    wolf_double_kill: false,
    is_day: true,
    first_night: false,
  });

  const backUpMessage = "No one died from a werewolf last night.\n";

  await organizedChannels.townSquare.send(
    `## ${message || backUpMessage}${starveMessage}${vampireDeathMessages}\n**It is day time**`
  );
  await checkGame(interaction);
}

// Handles town votes and death
async function nightTimeJob(interaction) {
  console.log("Running Night Job")
  const guildId = interaction.guild.id;
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  const game = await findGame(guildId);
  const settings = await findSettings(interaction.guild.id);
  // collect messages as players die
  interaction.townAnnouncements = [];

  if (game.first_night) {
    await updateGame(guildId, {
      is_day: false,
    });
    await organizedChannels?.werewolves?.send(
      "This is the first night. Choose someone to kill with the `/kill` command"
    );
    await organizedChannels?.bodyguard?.send(
      "This is the first night. Choose someone to guard with the `/guard` command"
    );
    await organizedChannels?.seer?.send(
      "This is the first night. Choose someone to see with the `/investigate` command"
    );
    await organizedChannels?.witch?.send(
      "This is the first night. Choose someone to curse with the `/curse` command"
    );
    await organizedChannels?.vampires?.send(
      "This is the first night. Choose someone to bite with the `/vampire_bite` command"
    );
    await organizedChannels?.outCasts?.send(
      "This is the first night. Choose someone to mute with the `/mute` command"
    )
    return;
  }
  if (!game.is_day) {
    console.log("It is currently night skip");
    return;
  }
  
  if (settings.can_whisper) {
    await resetUserWhisperCount(guildId)
  }
  await removeStunnedUsers(interaction)

  const chaosWinsIds = await handleVotingDeath(interaction)
  await checkGame(interaction, chaosWinsIds);
}

async function handleVotingDeath(interaction) {
  const playersDeathInfo = await handleHangingVotes(interaction)
  await votingDeathMessage({ interaction, playersDeathInfo })

  await updateGame(interaction.guild.id, {
    is_day: false,
  });
  return getChaosWinIds(playersDeathInfo);
}

function warningTime(hour, minute) {
  if (minute < 0) {
    minute = 60 + minute;
    hour -= 1;
    if (hour < 0) {
      hour = 23;
    }
  }

  if (minute > 60) {
    minute = minute - 60;
    hour += 1;
    if (hour > 24) {
      hour = 0;
    }
  }

  return {hour, minute}
}

function createScheduleRule(hour, minute) {
  const scheduleRule = new schedule.RecurrenceRule();
  scheduleRule.minute = minute;
  scheduleRule.hour = hour;
  scheduleRule.tz = process.env.TIME_ZONE_TZ;
  return scheduleRule;
}

module.exports = {
  timeScheduling,
  dayTimeJob,
  nightTimeJob,
};
