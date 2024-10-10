const { SlashCommandBuilder } = require("@discordjs/builders");
const _ = require("lodash");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil");
const { findSettings, findAllUsers } = require("../werewolf_db");
const { getPlayingCount } = require("../util/userHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const { getAliveUsersIds } = require("../util/discordHelpers");
const { channelNames } = require("../util/channelHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.WHO_IS_ALIVE)
    .setDescription(
      "Shows which players are alive in the game and number of villagers and werewolves"
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
    const channel = interaction.guild.channels.cache.get(interaction.channelId);

    const cursor = await findAllUsers(interaction.guild.id, aliveUsersId);
    const dbUsers = await cursor.toArray();

    if (_.isEmpty(dbUsers)) {
      const { playersCount, playingMembers } = await getPlayingCount(
        interaction
      );
      await interaction.reply({
        content: `Player count: ${playersCount}\n${_.join(
          playingMembers,
          "\n"
        )}`,
        ephemeral: false,
        allowedMentions: {
          parse: [],
        },
      });
      return;
    }

    const settings = await findSettings(interaction.guild.id);

    let message = "## Players Alive:\n";
    let deadMessage = "## Players Dead:\n";
    let werewolfCount = 0;
    let villagerCount = 0;
    let soloCount = 0;
    let vampireCount = 0;
    let someoneIsDead = false;

    const soloCharacters = [characters.CHAOS_DEMON]

    _.shuffle(dbUsers).forEach((user) => {
      let characterMessage = "";
      if (channel.name === channelNames.AFTER_LIFE || (user.is_dead && !settings.hard_mode)) {
        const vampireMessage = user.is_vampire ? "vampire " : "";
        characterMessage = `: **${vampireMessage}${user.character}**`;
      }
      if (!user.is_dead) {
        message += `${members.get(user.user_id)}${characterMessage}\n`;
        if (user.character === characters.WEREWOLF) {
          werewolfCount += 1;
        } else if (user.is_vampire) {
          vampireCount += 1;
        } else if (soloCharacters.includes(user.character)) {
          soloCount += 1;
        } else {
          villagerCount += 1;
        }
      } else {
        someoneIsDead = true;
        deadMessage += `${members.get(user.user_id) || "Player left"}${characterMessage}\n`;
      }
    });

    if (!settings.hard_mode) {
      const werewolfMessage = werewolfCount
        ? `Werewolf Count: ${werewolfCount}\n`
        : "";

      const vampireMessage = vampireCount
        ? `Vampire Count: ${vampireCount}\n`
        : "";
      
      const soloMessage = soloCount
        ? `Solo Character Count: ${soloCount}\n`
        : "";

      message += `${werewolfMessage}${vampireMessage}${soloMessage}Villager Count: ${villagerCount}\n`;
    }

    await interaction.reply({
      content: `${message}${someoneIsDead ? deadMessage : ""}`,
      ephemeral: false,
      allowedMentions: {
        parse: [],
      },
    });
  },
};
