const _ = require("lodash");
const { findSettings, updateUser } = require("../werewolf_db");
const { characters } = require("./characterHelpers/characterUtil");
const { ChannelType, PermissionsBitField } = require("discord.js");
const { getRole, roleNames } = require("./rolesHelpers");

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
  OUT_CASTS: "out-casts",
};

const setupChannelNames = {
  HOW_TO_PLAY: "how-to-play",
  PLAYER_ROLES: "player-roles",
  COMMANDS: "commands",
  GAME_INSTRUCTIONS: "game-instructions"
}

async function sendStartMessages(interaction, users) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);

  const werewolves = [];
  const masons = [];
  const seers = [];
  const bodyguards = [];
  const grannies = [];

  _.forEach(users, (user) => {
    switch (user.info.character) {
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
      case characters.BODYGUARD:
        bodyguards.push(user);
        break;
      case characters.GROUCHY_GRANNY:
        grannies.push(user);
        break;
    }
  });

  const characterCount = new Map();

  _.forEach(users, (user) => {
    let currentCount = characterCount.get(user.info.character);

    if (currentCount) {
      characterCount.set(user.info.character, currentCount + 1);
    } else {
      characterCount.set(user.info.character, 1);
    }
  });

  let printCharacters = "";
  characterCount.forEach((count, character) => {
    printCharacters += `${character}: ${count}\n`;
  });

  // Option to show what characters will be playing
  const printPlayers = false;
  if (printPlayers) {
    await organizedChannels.townSquare.send(
      `${townSquareStart}\nCharacters in game:\n${printCharacters}`
    );
  } else {
    await organizedChannels.townSquare.send(townSquareStart);
  }
  await organizedChannels.werewolves.send(
    `${werewolfStart}\nWerewolves:\n${werewolves}`
  );
  await organizedChannels.seer.send(`${seerStart}\nSeers:\n${seers}`);
  await organizedChannels.afterLife.send(
    `${afterLifeStart}\n${showUsersCharacter(users)}`
  );
  await organizedChannels.mason.send(`${masonStart}\nMasons:\n${masons}`);
  await organizedChannels.bodyguard.send(`${bodyguardStart}\nBodyguards:\n${bodyguards}`);
  await organizedChannels.witch.send(witchStart);
  await organizedChannels.vampires.send(vampireStart);
  await organizedChannels.outCasts.send(`${outCastStart}\nGrannies:\n${grannies}`);
}

function showUsersCharacter(users) {
  let message = "";

  _.shuffle(users).forEach((user) => {
    let character = user.info.character;
    let wasTold = "";
    if (user.info.is_cub) {
      character = characters.CUB;
    } else if (user.info.is_vampire) {
      character = `vampire ${characters.VAMPIRE}`;
    }
    if (character !== user.info.assigned_identity) {
      wasTold = `I told them they were a ${user.info.assigned_identity}`
    }
    message += `${user} is a ${character} ${wasTold}\n`;
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
          SendMessages: false,
          CreatePrivateThreads: false,
          CreatePublicThreads: false,
          SendMessagesInThreads: false,
          ViewChannel: true,
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
      break;
    case characters.GROUCHY_GRANNY:
      channel = organizedChannels.outCasts;
      break;
  }

  if (!channel) {
    return organizedChannels;
  }

  await channel.permissionOverwrites.edit(user, {
    SendMessages: true,
    ViewChannel: true,
    AddReactions: guildSettings.allow_reactions,
  });

  if (message) {
    await channel.send(message);
  }
  return organizedChannels;
}

async function createChannel(interaction, name, permissionOverwrites, parent) {
  return await interaction.guild.channels.create({
    name,
    parent,
    type: ChannelType.GuildText,
    permissionOverwrites,
  });
}

async function createCategory(interaction, name) {
  return await interaction.guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
  });
}

async function createPermissions(users, characters, guildSettings) {
  let allow = [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel];

  if (guildSettings.allow_reactions) {
    allow.push(PermissionsBitField.Flags.AddReactions);
  }

  return users
    .map((user) => {
      if (characters.includes(user.info.character)) {
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

async function joinMasons({
  interaction,
  targetUser,
  player,
  playerMember,
  roleName,
}) {
  if (targetUser.character === characters.MASON && !player.on_mason_channel) {
    await updateUser(player.user_id, interaction.guild.id, {
      on_mason_channel: true,
    });
    await giveChannelPermissions({
      interaction,
      user: playerMember,
      character: characters.MASON,
      message: `The ${roleName} ${playerMember} has joined!`,
    });
  }
}

function getRandomBotGif() {
  return _.sample(botGifs);
}

async function removeAllGameChannels(channels) {
  await Promise.all(
    channels.map(async (channel) => {
      switch (channel.name) {
        case channelNames.TOWN_SQUARE:
        case channelNames.WEREWOLVES:
        case channelNames.SEER:
        case channelNames.MASON:
        case channelNames.AFTER_LIFE:
        case channelNames.THE_TOWN:
        case channelNames.BODYGUARD:
        case channelNames.WITCH:
        case channelNames.VAMPIRES:
        case channelNames.OUT_CASTS:
          await channel.delete();
      }
    })
  );
}

async function createChannels(interaction, users) {
  const currentChannels = await interaction.guild.channels.fetch();
  await removeAllGameChannels(currentChannels);

  const aliveRole = await getRole(interaction, roleNames.ALIVE);
  const deadRole = await getRole(interaction, roleNames.DEAD);

  const threadPermissions = [
    PermissionsBitField.Flags. CreatePrivateThreads,
    PermissionsBitField.Flags. CreatePublicThreads,
    PermissionsBitField.Flags. SendMessagesInThreads,
  ];

  const guildSettings = await findSettings(interaction.guild.id);
  const nonPlayersPermissions = {
    id: interaction.guild.id,
    deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, ...threadPermissions],
    allow: [PermissionsBitField.Flags.ViewChannel],
  };

  const deadPermissions = {
    id: deadRole.id,
    deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, ...threadPermissions],
    allow: [PermissionsBitField.Flags.ViewChannel],
  };

  const denyAlivePermissions = {
    id: aliveRole.id,
    deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, ...threadPermissions],
  };

  let allow = [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel];

  if (guildSettings.allow_reactions) {
    allow.push(PermissionsBitField.Flags.AddReactions);
  }

  const defaultPermissions = [
    deadPermissions,
    denyAlivePermissions,
    nonPlayersPermissions,
  ];

  const townSquarePermissions = [
    nonPlayersPermissions,
    deadPermissions,
    {
      id: aliveRole.id,
      allow,
    },
  ];

  const afterLifePermissions = [
    nonPlayersPermissions,
    {
      id: aliveRole.id,
      deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, ...threadPermissions],
    },
    {
      id: deadRole.id,
      allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
    },
  ];

  const createChannelsData = [
    {
      channelName: channelNames.TOWN_SQUARE,
      permissions: townSquarePermissions,
    },
    {
      channelName: channelNames.WEREWOLVES,
      characterNames: [characters.WEREWOLF],
    },
    {
      channelName: channelNames.SEER,
      characterNames: [characters.SEER, characters.FOOL]
    },
    {
      channelName: channelNames.AFTER_LIFE,
      permissions: afterLifePermissions,
    },
    {
      channelName: channelNames.MASON,
      characterNames: [characters.MASON],
    },
    {
      channelName: channelNames.BODYGUARD,
      characterNames: [characters.BODYGUARD],
    },
    {
      channelName: channelNames.WITCH,
      characterNames: [characters.WITCH],
    },
    {
      channelName: channelNames.VAMPIRES,
      characterNames: [characters.VAMPIRE],
    },
    {
      channelName: channelNames.OUT_CASTS,
      characterNames: [characters.GROUCHY_GRANNY],
    },
  ];

  const category = await createCategory(interaction, channelNames.THE_TOWN);

  for (const channelData of createChannelsData) {
    let permissions = channelData.permissions;
    if (!permissions) {
      permissions = defaultPermissions
    }
    if (!_.isEmpty(channelData.characterNames)) {
      const characterPermissions = await createPermissions(users, channelData.characterNames, guildSettings)
      permissions = permissions.concat(characterPermissions)
    }
    await createChannel(
      interaction,
      channelData.channelName,
      permissions,
      category
    );
  }
}

module.exports = {
  createChannel,
  createCategory,
  sendStartMessages,
  organizeChannels,
  giveChannelPermissions,
  removeChannelPermissions,
  onDmChannel,
  getRandomBotGif,
  joinMasons,
  createChannels,
  removeAllGameChannels,
  channelNames,
  setupChannelNames,
};

const townSquareStart =
  "Welcome to the town-square! Here you will vote for who you think the werewolves are.";

const werewolfStart =
  "Welcome to the werewolf channel! Talk to your fellow werewolves and mark your next target with the `/kill` command at night to kill the villagers";

const seerStart =
  "Welcome to the seer channel! At night use the command `/investigate` to pick a player to find out if they are a werewolf or villager.";

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
  "Welcome to the Grouchy Granny's House";

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
