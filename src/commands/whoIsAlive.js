const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames, characters } = require("../util/commandHelpers");
const { findUsersWithIds } = require("../werewolf_db");
const { getPlayingCount } = require("../util/userHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { getAliveUsersIds } = require("../util/discordHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.WHO_IS_ALIVE)
    .setDescription(
      "Shows witch players are alive in the game and number of villagers and werewolves"
    ),
  async execute(interaction) {

    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
    });

    if (deniedMessage) {
      await interaction.reply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    const aliveUsersId = await getAliveUsersIds(interaction);
    const members = await interaction.guild.members.fetch();

    const cursor = await findUsersWithIds(interaction.guild.id, aliveUsersId);
    const dbUsers = await cursor.toArray();

    message = "Players Alive:\n";
    werewolfCount = 0;
    villagerCount = 0;
    vampireCount = 0;

    _.shuffle(dbUsers).forEach((user) => {
      message += `${members.get(user.user_id)}\n`;
      if (user.character === characters.WEREWOLF) {
        werewolfCount += 1;
      } else if (user.is_vampire) {
        vampireCount += 1;
      } else {
        villagerCount += 1;
      }
    });

    if (_.isEmpty(dbUsers)) {
      await interaction.reply({
        content: `Player count: ${await getPlayingCount(interaction)}`,
        ephemeral: false,
      });
      return;
    }

    const vampireMessage = vampireCount
      ? `Vampire Count: ${vampireCount}\n`
      : "";

    message += `Werewolf Count: ${werewolfCount}\n${vampireMessage}Villager Count: ${villagerCount}`;

    await interaction.reply({
      content: message,
      ephemeral: false,
    });
  },
};
