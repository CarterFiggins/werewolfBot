const _ = require("lodash");
const { findAllGames } = require("../werewolf_db");
const { timeScheduling } = require("../util/timeHelper");

module.exports = {
  name: "ready",
  once: true, // only runs once
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    const games = await findAllGames()
    const guilds = await client.guilds.fetch()

    for (game of games) {
      const results = guilds.get(game.guild_id)
      if (!results) {
        continue;
      }
      const guild = await results.fetch()
      await guild.members.fetch()
      await guild.roles.fetch()
      await guild.channels.fetch()
      const interaction = {
        guild,
        reply: () => {}
      }
      await timeScheduling(interaction)
    }
  },
};
