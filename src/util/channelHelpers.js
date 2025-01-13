const _ = require("lodash");
const { findSettings, updateUser } = require("../werewolf_db");
const { characters, getCards } = require("./characterHelpers/characterUtil");
const { ChannelType, PermissionsBitField } = require("discord.js");
const { getRole, roleNames } = require("./rolesHelpers");
const { showAllPowerUpMessages } = require("./commandHelpers");

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
  OUT_CASTS: "grannys-house",
  MONARCH: "monarch",
};

const setupChannelNames = {
  HOW_TO_PLAY: "how-to-play",
  PLAYER_ROLES: "player-roles",
  COMMANDS: "commands",
  GAME_INSTRUCTIONS: "game-instructions",
  SETTINGS: "settings",
  ADMIN_SETTINGS: "admin-settings",
}

async function sendStartMessages(interaction, users) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);

  const werewolves = [];
  const masons = [];
  const bodyguards = [];
  const grannies = [];
  const monarchs = [];

  _.forEach(users, (user) => {
    switch (user.info.character) {
      case characters.WEREWOLF:
        werewolves.push(user);
        break;
      case characters.MASON:
        masons.push(user);
        break;
      case characters.BODYGUARD:
        bodyguards.push(user);
        break;
      case characters.GROUCHY_GRANNY:
        grannies.push(user);
        break;
      case characters.MONARCH:
        monarchs.push(user);
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

  await organizedChannels.townSquare.send(townSquareStart);
  const townSquarePlayerMessage =  await organizedChannels.townSquare.send(`Possible characters in game:\n${(await possibleCharactersInGame(interaction)).join(", ")}`)
  townSquarePlayerMessage.pin()

  await organizedChannels?.werewolves?.send(
    `${werewolfStart}\nWerewolves:\n${werewolves}`
  );
  
  if (!_.isEmpty(organizedChannels?.seerChannels)) {
    for (const channel of organizedChannels.seerChannels) {
      await channel.send(`${seerStart}`);
    }
  }

  const afterLifeMessage = await organizedChannels.afterLife.send(
    `${afterLifeStart}\n${showUsersCharacter(users)}`
  );
  afterLifeMessage.pin()
  await organizedChannels?.mason?.send(`${masonStart}\nMasons:\n${masons}`);
  await organizedChannels?.bodyguard?.send(`${bodyguardStart}\nBodyguards:\n${bodyguards}`);
  await organizedChannels?.witch?.send(witchStart);
  await organizedChannels?.vampires?.send(vampireStart);
  await organizedChannels?.outCasts?.send(`${outCastStart}\nGrannies:\n${grannies}`);
  await organizedChannels?.monarch?.send(`${monarchStart}\nMonarchs:\n${monarchs}`);
}

function showUsersCharacter(users) {
  let message = "";

  _.orderBy(users, ['info.character'], ['asc'] ).forEach((user) => {
    let character = user.info.character;
    let wasTold = "";
    if (user.info.is_cub) {
      character = characters.CUB;
    } else if (user.info.is_vampire) {
      character = `vampire ${characters.VAMPIRE}`;
    }
    if (character !== user.info.assigned_identity && !user.info.is_vampire) {
      wasTold = `I told them they were a ${user.info.assigned_identity}`
    }
    message += `${user} is a ${character}. ${wasTold}\n`;
  });
  return message;
}

function organizeChannels(channels) {
  const channelObject = {seerChannels: []};
  channels.forEach((channel) => {
    switch (channel.name) {
      case channelNames.TOWN_SQUARE:
        channelObject.townSquare = channel;
        break;
      case channelNames.WEREWOLVES:
        channelObject.werewolves = channel;
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
      case channelNames.MONARCH:
        channelObject.monarch = channel;
        break;
    }
    if (channel.name.includes(channelNames.SEER)) {
      channelObject.seerChannels.push(channel)
    }
  });
  return channelObject;
}

function flatOrganizedChannels(organizedChannels) {
  const [arrayChannels, singleChannels] = _.partition(organizedChannels, (c) => _.isArray(c))
  return [...singleChannels, ..._.flatten(arrayChannels)]
}

async function removeChannelPermissions(interaction, user) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);
  await Promise.all(
    _.map(flatOrganizedChannels(organizedChannels), async (channel) => {
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
  joiningDbUser,
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
      const channels = interaction.guild.channels.cache;
      channel = channels.get(joiningDbUser.channel_id.toString());
      await updateUser(user.id, interaction.guild.id, {
        channel_id: channel.id,
      })
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
    await channel?.send(message);
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
        case channelNames.MASON:
        case channelNames.AFTER_LIFE:
        case channelNames.THE_TOWN:
        case channelNames.BODYGUARD:
        case channelNames.WITCH:
        case channelNames.VAMPIRES:
        case channelNames.OUT_CASTS:
        case channelNames.MONARCH:
          await channel.delete();
      }
      if (channel.name.includes(channelNames.SEER)) {
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

  const allUserCharacters = _.map(users, (u) => u.info.character)
  const seerOrFoolUsers = _.filter(users, (u) => u.info.character === characters.SEER || u.info.character === characters.FOOL)

  const allChannelsData = [
    {
      channelName: channelNames.TOWN_SQUARE,
      permissions: townSquarePermissions,
      defaultChannel: true,
    },
    {
      channelName: channelNames.AFTER_LIFE,
      permissions: afterLifePermissions,
      defaultChannel: true,
    },
    {
      channelName: channelNames.WEREWOLVES,
      characterNames: [characters.WEREWOLF],
      defaultChannel: true,
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
    {
      channelName: channelNames.MONARCH,
      characterNames: [characters.MONARCH],
    },
  ];

  seerOrFoolUsers.forEach((user) => {
    allChannelsData.push({
      channelName: `${user.username.substring(0, 50)}-the-seer`,
      singlePermission: true,
      characterNames: [user.info.character],
      player: user,
    })
  })

  const createChannelsData = _.filter(allChannelsData, (data) => {
    if (data.defaultChannel) {
      return true
    }
    if (data?.singlePermission) {
      return true
    }
    if (!_.isEmpty(_.intersection(data.characterNames, allUserCharacters))) {
      return true
    }
    return false
  })

  const category = await createCategory(interaction, channelNames.THE_TOWN);

  for (const channelData of createChannelsData) {
    let permissions = channelData.permissions;
    if (!permissions) {
      permissions = defaultPermissions
    }
    const channelUsers = channelData.singlePermission ? [channelData.player] : users

    if (!_.isEmpty(channelData.characterNames)) {
      const characterPermissions = await createPermissions(channelUsers, channelData.characterNames, guildSettings)
      permissions = permissions.concat(characterPermissions)
    }
    const channel = await createChannel(
      interaction,
      channelData.channelName,
      permissions,
      category
    );
    if (channelData.singlePermission) {
      await updateUser(channelData.player.id, interaction.guild.id, {
        channel_id: channel.id,
      })
    }
  }
}

async function possibleCharactersInGame(interaction) {
  const settings = await findSettings(interaction.guild.id);
  const { wolfCards, villagerCards } = getCards(settings);
  const otherCards = [];
  if (!settings.random_cards) {
    if (settings.extra_characters) {
      wolfCards.push(characters.WITCH);
    }
    villagerCards.push(characters.BAKER);
  }

  if (settings.allow_vampires) {
    otherCards.push(`Vampire ${characters.VAMPIRE}`)
  }

  if (settings.allow_chaos_demon) {
    otherCards.push(characters.CHAOS_DEMON)
  }

  return _.map([...wolfCards, ...villagerCards, ...otherCards], _.capitalize)
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
  flatOrganizedChannels,
  channelNames,
  setupChannelNames,
};

const townSquareStart =
  "Welcome to the town-square! Here you will vote for who you think the werewolves are.";

const werewolfStart =
  "Welcome to the werewolf channel! Talk to your fellow werewolves and mark your next target with the `/kill` command at night to kill the villagers";

const seerStart =
  "Welcome to the seer channel! At night use the command `/investigate` to pick a player to find out if they are a werewolf or villager. Oh and there is a chance you could be a fool... but we are all counting on you!";

const afterLifeStart =
  "You are dead... There's not much to do except talk to other dead players and watch the game";

const masonStart =
  "You are the masons. You can't tell anyone! This is a secretive group. If the body guard protects one of you than he/she will join! You are on the villager's side and you know everyone in this group is not a werewolf";

const bodyguardStart =
  "You are a bodyguard who protects this town! Use the `/guard` command to guard people at night. If you guard a player that the werewolves attack you will save them and they will not die. You can guard yourself but you can't guard someone twice in a row";

const witchStart =
  "You are a witch! You help the werewolves by cursing villagers with the `/curse` command. If the villagers kill you than all the villagers who have the curse will die.";

const vampireStart =
  "You are a vampire! Use the '/vampire_bite' command to turn villagers into vampires. **Vampire king's first bite might transform a player into a vampire depending on the settings** after that it takes two bites for them to transform. Watch out for werewolves! They will kill you if you try to bite them or get in the way of their prey. Depending on the settings this might not apply to the vampire king";

const outCastStart =
  "Welcome to the Grouchy Granny's House. This is where players will be kicked to when they are muted.";

const monarchStart =
  `You are a monarch! Use the \`/bestow_power <target_user> <power>\` command to give away power. You will not be able to give power to yourself. You can only give out a power once and can not give power twice to the same player.\nAll powers that can be used with the messages that will be told to the player who get the power\n${showAllPowerUpMessages()}`

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
