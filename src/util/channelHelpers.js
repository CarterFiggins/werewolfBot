const _ = require("lodash");

const channelNames = {
  THE_TOWN: "the-town",
  TOWN_SQUARE: "town-square",
  WEREWOLVES: "werewolves",
  SEER: "seer",
  BODYGUARD: "bodyguard",
  AFTER_LIFE: "after-life",
  MASON: "mason",
};

async function sendStartMessages(interaction, users) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);

  organizedChannels.townSquare.send(townSquareStart);
  organizedChannels.werewolves.send(werewolfStart);
  organizedChannels.seer.send(seerStart);
  organizedChannels.afterLife.send(
    `${afterLifeStart}\n${showUsersCharacter(users)}`
  );
  organizedChannels.mason.send(masonStart);
  organizedChannels.bodyguard.send(bodyguardStart);
}

function showUsersCharacter(users) {
  let message = "";

  _.shuffle(users).forEach((user) => {
    message += `${user} is a ${user.character}\n`;
  });
  return message;
}

function organizeChannels(channels) {
  channelObject = {};
  channels.forEach((channel) => {
    switch (channel.name) {
      case channelNames.TOWN_SQUARE:
        channelObject.townSquare = channel;
        break;
      case channelNames.WEREWOLVES:
        channelObject.werewolves = channel;
        break;
      case channelNames.SEER:
        channelObject.seer = channel;
        break;
      case channelNames.AFTER_LIFE:
        channelObject.afterLife = channel;
        break;
      case channelNames.MASON:
        channelObject.mason = channel;
        break;
      case channelNames.BODYGUARD:
        channelObject.bodyguard = channel;
        break;
    }
  });
  return channelObject;
}

module.exports = {
  sendStartMessages,
  organizeChannels,
  channelNames,
};

const townSquareStart =
  "Welcome to the town-square! Here you will vote for who you think the werewolves are.";

const werewolfStart =
  "Welcome to the werewolf channel! Talk to your fellow werewolves and mark your next target with the `/kill` command at night to kill the villagers";

const seerStart =
  "Welcome to the seer channel! At night use the command `/see` to pick a player to find out if they are a werewolf or villager.";

const afterLifeStart =
  "You are dead... There not much to do except talk to other dead players and watch the game";

const masonStart =
  "You are the masons. You can't tell anyone! This is a secretive group. If the body guard protects one of you than he/she will join! You are on the villager's side and you know everyone in this group is not a werewolf";

const bodyguardStart =
  "You are a bodyguard who protects this town! Use the `/guard` command to guard people at night. If you guard a player that the werewolves attack you will save them and they will not die. You can guard yourself but you can't guard someone twice in a row";
