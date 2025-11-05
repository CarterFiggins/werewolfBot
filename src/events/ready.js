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

// Process guilds in parallel with error handling
    await Promise.allSettled(
      games.map(async (game) => {
        try {
          const guildResult = guilds.get(game.guild_id);
          if (!guildResult) return;

          const guild = await guildResult.fetch();
          await guild.roles.fetch();
          await guild.channels.fetch();
          
          const interaction = {
            guild,
            reply: () => {}
          };
          
          await timeScheduling(interaction);
        } catch (error) {
          console.error(`Error processing guild ${game.guild_id}:`, error);
        }
      })
    );
  },
};
