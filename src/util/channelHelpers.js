const _ = require("lodash");
const { findSettings } = require("../werewolf_db");
const { characters } = require("./commandHelpers");

const channelNames = {
  THE_TOWN: "the-town",
  TOWN_SQUARE: "town-square",
  WEREWOLVES: "werewolves",
  SEER: "seer",
  BODYGUARD: "bodyguard",
  AFTER_LIFE: "after-life",
  MASON: "mason",
  WITCH: "witch",
  VAMPIRES: "vampires",
  OUT_CASTS: "out-casts"
};

async function sendStartMessages(interaction, users) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);

  const werewolves = [];
  const masons = [];
  const seers = [];

  _.forEach(users, (user) => {
    switch (user.character) {
      case characters.WEREWOLF:
        werewolves.push(user);
        break;
      case characters.MASON:
        masons.push(user);
        break;
      case characters.SEER:
      case characters.FOOL:
        seers.push(user);
        break;
    }
  });

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

  // Option to show what characters will be playing
  const printPlayers = false;
  if (printPlayers) {
    organizedChannels.townSquare.send(
      `${townSquareStart}\nCharacters in game:\n${printCharacters}`
    );
  } else {
    organizedChannels.townSquare.send(townSquareStart);
  }
  organizedChannels.werewolves.send(
    `${werewolfStart}\nWerewolves:\n${werewolves}`
  );
  organizedChannels.seer.send(`${seerStart}\nSeers:\n${seers}`);
  organizedChannels.afterLife.send(
    `${afterLifeStart}\n${showUsersCharacter(users)}`
  );
  organizedChannels.mason.send(`${masonStart}\nMasons:\n${masons}`);
  organizedChannels.bodyguard.send(bodyguardStart);
  organizedChannels.witch.send(witchStart);
  organizedChannels.vampires.send(vampireStart);
  organizedChannels.outCasts.send(outCastStart);
}

function showUsersCharacter(users) {
  let message = "";

  _.shuffle(users).forEach((user) => {
    let character = user.character;
    if (user.is_cub) {
      character = characters.CUB;
    } else if (user.is_vampire) {
      character = `vampire ${characters.VAMPIRE}`;
    }
    message += `${user} is a ${character}\n`;
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
      case channelNames.WITCH:
        channelObject.witch = channel;
        break;
      case channelNames.VAMPIRES:
        channelObject.vampires = channel;
        break;
      case channelNames.OUT_CASTS:
        channelObject.outCasts = channel;
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
          CREATE_PRIVATE_THREADS: false,
          CREATE_PUBLIC_THREADS: false,
          SEND_MESSAGES_IN_THREADS: false,
          VIEW_CHANNEL: true,
        });
      }
    })
  );
}

async function giveChannelPermissions({
  interaction,
  user,
  character,
  message,
}) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  const guildSettings = await findSettings(interaction.guild.id);
  let channel;

  switch (character) {
    case characters.WEREWOLF:
      channel = organizedChannels.werewolves;
      break;
    case characters.WITCH:
      channel = organizedChannels.witch;
      break;
    case characters.BODYGUARD:
      channel = organizedChannels.bodyguard;
      break;
    case characters.MASON:
      channel = organizedChannels.mason;
      break;
    case characters.VAMPIRE:
      channel = organizedChannels.vampires;
      break;
    case characters.SEER:
    case characters.FOOL:
      channel = organizedChannels.seer;
      break;
    case characters.VILLAGER:
      channel = organizedChannels.townSquare;
  }

  if (!channel) {
    return organizedChannels;
  }

  await channel.permissionOverwrites.edit(user, {
    SEND_MESSAGES: true,
    VIEW_CHANNEL: true,
    ADD_REACTIONS: guildSettings.allow_reactions,
  });

  if (message) {
    await channel.send(message);
  }
  return organizedChannels;
}

async function createChannel(interaction, name, permissionOverwrites, parent) {
  return await interaction.guild.channels.create(name, {
    parent,
    type: "GUILD_TEXT",
    permissionOverwrites,
  });
}

async function createCategory(interaction, name) {
  return await interaction.guild.channels.create(name, {
    type: "GUILD_CATEGORY",
  });
}

async function createPermissions(users, character, guildSettings) {
  let allow = ["SEND_MESSAGES", "VIEW_CHANNEL"];

  if (guildSettings.allow_reactions) {
    allow.push("ADD_REACTIONS");
  }

  return users
    .map((user) => {
      if (user.character === character) {
        return {
          id: user.id,
          allow,
        };
      }
    })
    .filter((u) => u);
}

function onDmChannel(interaction) {
  return interaction.channel.type == "DM";
}

function getRandomBotGif() {
  return _.sample(botGifs);
}

module.exports = {
  createChannel,
  createCategory,
  createPermissions,
  sendStartMessages,
  organizeChannels,
  giveChannelPermissions,
  removeChannelPermissions,
  onDmChannel,
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

const witchStart =
  "You are a witch! You help the werewolves by cursing villagers with the `/curse` command. If the villagers kill you than all the villagers who have the curse will die. If the werewolves kill you the curse will break and they will not die";

const vampireStart =
  "You are a vampire! Use the '/vampire_bite' command to turn villagers into vampires. **Vampire king's first bite will transform a player into a vampire** after that it takes two bites for them to transform. Watch out for werewolves! They will kill you if you try to bite them or get in the way of their prey.";

const outCastStart =
  "Welcome out casts! You may leave a message to talk to the other outcasts that will be cast out from the grouchy granny"

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
