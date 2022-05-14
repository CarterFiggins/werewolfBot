const _ = require("lodash");
const schedule = require("node-schedule");

async function endGuildJobs(interaction) {
  const guildId = interaction.guild.id;
  const { scheduledJobs } = schedule;

  _.forEach(scheduledJobs, (job, jobName) => {
    if (_.includes(jobName, guildId.toString())) {
      console.log(`canceling ${jobName}`);
      schedule.cancelJob(job);
    }
  });
}

module.exports = {
  endGuildJobs,
};
