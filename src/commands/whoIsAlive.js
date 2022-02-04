const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames, characters } = require("../util/commandHelpers");
const { getRole, roleNames } = require("../util/rolesHelpers");
const { findUsersWithIds } = require("../werewolf_db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.WHO_IS_ALIVE)
    .setDescription(
      "Shows witch players are alive in the game and number of villagers and werewolves"
    ),
  async execute(interaction) {
    let aliveRole = await getRole(interaction, roleNames.ALIVE);
    const members = await interaction.guild.members.fetch();
    const AliveUsersId = members
      .map((member) => {
        if (member._roles.includes(aliveRole.id)) {
          return member.user.id;
        }
      })
      .filter((m) => m);

    const cursor = await findUsersWithIds(interaction.guild.id, AliveUsersId);
    const dbUsers = await cursor.toArray();

    message = "Players Alive:\n";
    werewolfCount = 0;
    villagerCount = 0;

    _.shuffle(dbUsers).forEach((user) => {
      message += user.nickname
        ? `**${user.nickname}**\n`
        : `**${user.name}**\n`;
      if (user.character === characters.WEREWOLF) {
        werewolfCount += 1;
      } else {
        villagerCount += 1;
      }
    });

    if (_.isEmpty(dbUsers)) {
      await interaction.reply({
        content:
          "No one is alive sorry...\nhttps://tenor.com/view/status-tired-dead-haggard-gif-11733031",
        ephemeral: true,
      });
      return;
    }

    message += `Werewolf Count: ${werewolfCount}\nVillager Count: ${villagerCount}`;

    await interaction.reply(message);
  },
};
