const channelNames = {
  THE_TOWN: "the-town",
  TOWN_SQUARE: "town-square",
  WEREWOLVES: "werewolves",
  SEER: "seer",
  AFTER_LIFE: "after-life",
  MASON: "mason",
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

async function sendStartMessages(interaction) {
  const channels = await interaction.guild.channels.fetch();
  const organizedChannels = organizeChannels(channels);

  organizedChannels.townSquare.send(townSquareStart);
  organizedChannels.werewolves.send(werewolfStart);
  organizedChannels.seer.send(seerStart);
  organizedChannels.afterLife.send(afterLifeStart);
  organizedChannels.mason.send(masonStart);
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
    }
  });
  return channelObject;
}

module.exports = {
  sendStartMessages,
  organizeChannels,
  channelNames,
};
