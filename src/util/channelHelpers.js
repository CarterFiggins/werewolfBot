const _ = require("lodash");
const { characters } = require("./commandHelpers");

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

  const werewolves = _.filter(
    users,
    (user) => user.character === characters.WEREWOLF
  );

  const seers = _.filter(
    users,
    (user) =>
      user.character === characters.SEER || user.character === characters.FOOL
  );

  const masons = _.filter(users, (user) => user.character === characters.MASON);

  const characterCount = new Map();

  _.forEach(users, (user) => {
    let currentCount = characterCount.get(user.character);

    if (currentCount) {
      characterCount.set(user.character, currentCount + 1);
    } else {
      characterCount.set(user.character, 1);
    }
  });

  let printCharacters = "";
  characterCount.forEach((count, character) => {
    printCharacters += `${character}: ${count}\n`;
  });

  organizedChannels.townSquare.send(
    `${townSquareStart}\nCharacters in game:\n${printCharacters}`
  );
  organizedChannels.werewolves.send(
    `${werewolfStart}\nWerewolves:\n${werewolves}`
  );
  organizedChannels.seer.send(`${seerStart}\nSeers:\n${seers}`);
  organizedChannels.afterLife.send(
    `${afterLifeStart}\n${showUsersCharacter(users)}`
  );
  organizedChannels.mason.send(`${masonStart}\nMasons:\n${masons}`);
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

async function removeChannelPermissions(interaction, user) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  await Promise.all(
    _.map(organizedChannels, async (channel) => {
      if (channel.name !== channelNames.AFTER_LIFE) {
        await channel.permissionOverwrites.edit(user, {
          SEND_MESSAGES: false,
          VIEW_CHANNEL: true,
        });
      }
    })
  );
}

async function giveWerewolfChannelPermissions(interaction, user) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  await organizedChannels.werewolves.permissionOverwrites.edit(user, {
    SEND_MESSAGES: true,
    VIEW_CHANNEL: true,
  });
}

async function giveMasonChannelPermissions(interaction, user) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);

  await organizedChannels.mason.permissionOverwrites.edit(user, {
    SEND_MESSAGES: true,
    VIEW_CHANNEL: true,
  });

  organizedChannels.mason.send(`The bodyguard ${user} has joined!`);
}

async function giveSeerChannelPermissions(interaction, user) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);

  await organizedChannels.seer.permissionOverwrites.edit(user, {
    SEND_MESSAGES: true,
    VIEW_CHANNEL: true,
  });
}

function getRandomBotGif() {
  return _.head(_.shuffle(botGifs));
}

module.exports = {
  sendStartMessages,
  organizeChannels,
  giveMasonChannelPermissions,
  giveSeerChannelPermissions,
  giveWerewolfChannelPermissions,
  removeChannelPermissions,
  getRandomBotGif,
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

const botGifs = [
  "https://tenor.com/bgdxA.gif",
  "https://tenor.com/butD6.gif",
  "https://tenor.com/bnYU9.gif",
  "https://tenor.com/bdCga.gif",
  "https://tenor.com/bnYVe.gif",
  "https://tenor.com/VNmQ.gif",
  "https://tenor.com/OjmN.gif",
  "https://tenor.com/bm86m.gif",
  "https://tenor.com/bNV6d.gif",
  "https://tenor.com/bEteI.gif",
  "https://tenor.com/bkDNh.gif",
  "https://tenor.com/bEtei.gif",
  "https://tenor.com/yyj8.gif",
  "https://tenor.com/bj0ti.gif",
  "https://tenor.com/uQ6W.gif",
  "https://tenor.com/ZyKH.gif",
  "https://tenor.com/v9FS.gif",
];
