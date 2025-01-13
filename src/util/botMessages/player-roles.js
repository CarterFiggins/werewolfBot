const { showAllPowerUpMessages, characters } = require("../commandHelpers");

roles = [
  {
    label: "Villager",
    tag: characters.VILLAGER,
    team: "villager",
    emoji: "🧑‍🌾",
    description: `### Villager
* A regular villager.
* Channels: none
* Commands: none`,
  },
  {
    label: "Bodyguard",
    tag: characters.BODYGUARD,
    emoji: "💂",
    team: "villager",
    description: `### Bodyguard
* At night, the bodyguard may guard a player. If the guarded player is targeted, the attack will fail. If the bodyguard protects a vampire, (s)he will find out that the player is a vampire. If a bodyguard protects a player from an attack, (s)he will know the vampire who tried to attack the player. If the bodyguard guards the witch, (s)he will be told the witch is a vampire. The bodyguard will not know if the vampire is the vampire king or a converted vampire.
* Channels: bodyguard (potentially mason)
* Commands: \`/guard\``,
  },
  {
    label: "Seer",
    tag: characters.SEER,
    emoji: "🔮",
    team: "villager",
    description: `### Seer
* At night the seer may choose someone to investigate. Lycans and werewolves will appear as werewolves and vampires and villagers will appear as villagers.
* Channels: seer
* Commands: \`/investigate\``,
  },
  {
    label: "Fool",
    tag: characters.FOOL,
    emoji: "🤡",
    team: "villager",
    description: `### Fool 
* The fool is told (s)he is the seer but when investigating, (s)he will receive a random answer. The fool will be in their own seer channel.
* Channels: seer
* Commands: \`/investigate\``,
  },
  {
    label: "Apprentice Seer",
    tag: characters.SEER,
    emoji: "🪄",
    team: "villager",
    description: `### Apprentice Seer
* The apprentice seer takes over the seer seat if the seer is killed. They will join the old seer's channel and see the history of what they have done. They will not become the fool if the fool dies.
* Channels: seer
* Commands \`/investigate\``,
  },

  {
    label: "Mason",
    tag: characters.MASON,
    emoji: "🤵",
    team: "villager",
    description: `### Mason
* The masons are a secret group of villagers with no powers aside from being in this exclusive club. If the bodyguard guards a mason, the bodyguard will join the group. They work together to determine which other villagers can be trusted.
* Channels: mason
* Commands: none`,
  },
  {
    label: "Baker",
    tag: characters.BAKER,
    emoji: "🧑‍🍳",
    team: "villager",
    description: `### Baker
* The baker makes bread for the village. If the baker dies, the villagers start to starve to death. After the death of the baker, one villager will die every morning. The werewolves, the vampires, and the hunter(s) will not starve.
* Channels: none
* Commands: none`,
  },
  {
    label: "Hunter",
    tag: characters.HUNTER,
    emoji: "🔫",
    team: "villager",
    description: `### Hunter
* When the hunter is killed, whoever they have been targeting will be shot and killed. The hunter is immune to starvation.
* Channels: hunting-party
* Commands: \`/shoot\``,
  },
  {
    label: "Monarch",
    tag: characters.MONARCH,
    emoji: "🦋",
    team: "villager",
    description: `### Monarch
* The Monarch can give powers to other players. They only have one of each power to give. They can give one power each night and they will not be able to give that player another power. Powers that can be given.\n${showAllPowerUpMessages()}
* Channels: monarch
* Commands: \`/bestow_power\``,
  },
  {
    label: "Lycan",
    tag: characters.LYCAN,
    emoji: "🌝",
    team: "villager",
    description: `### Lycan
* Lycans will be told they are regular villagers. However, they will appear to the seer as werewolves. The first attack from a werewolf will be guarded but will die on the second attempt.
* Commands: none`,
  },
  {
    label: "Grouchy Granny",
    tag: characters.GROUCHY_GRANNY,
    emoji: "👵",
    team: "villager",
    description: `### Grouchy Granny
  * The grouchy granny is a villager. Each night, she can choose to mute one player, preventing them from speaking the next day and stops them from using their power.
  * Channels: grannys-house
  * Commands: \`/mute\``,
  },
  {
    label: "Mutated Villager",
    tag: characters.MUTATED,
    emoji: "☣️",
    team: "villager/werewolf",
    description: `### Mutated Villager
* A mutated villager will be told (s)he is a villager, hunter, or baker and is initially on the villager team. If attacked by a werewolf, the mutated villager will turn into a werewolf. If bitten by a vampire, the mutated villager will turn into a vampire king.
* Channels: none
* Commands: none`,
  },
  {
    label: "Werewolf",
    tag: characters.WEREWOLF,
    emoji: "🐺",
    team: "werewolf",
    description: `### Werewolf
* Werewolves appear as regular villagers during the day, but turn into bloodthirsty monsters at night. Each night, the pack of werewolves decide amongst themselves who to target that night. One werewolf uses the command.
* Channels: werewolves
* Commands: \`kill\``,
  },
  {
    label: "Werewolf Cub",
    tag: characters.CUB,
    emoji: "🐺",
    team: "werewolf",
    description: `### Werewolf Cub
* The werewolf cub is a baby werewolf. When the werewolf cub is lynched, the remaining werewolves can use the kill command twice the following night.
* Channels: werewolves
* Commands: \`kill\``,
  },
  {
    label: "Doppelganger",
    tag: characters.DOPPELGANGER,
    emoji: "©️",
    team: "unknown",
    description: `### Doppelganger
* During the first night, the doppelganger may copy another player and become that character. The player copied is unaware (s)he was copied
* Channels: same as the copied player
* Commands: \`copy\``,
  },
  {
    label: "Witch",
    tag: characters.WITCH,
    emoji: "🧙",
    team: "werewolf",
    description: `### Witch
* Each night, the witch chooses someone to curse. If the witch is lynched or shot, all players that the witch has cursed will die. If the witch starves the cursed will not die. The curse will not affect werewolves. The witch will appear as a vampire to the bodyguard. If the werewolves try to target the witch the witch will join werewolves. The witch will not be in the who is alive werewolf count but will count on the werewolf team when checking if the game is over.
* Channels: witch (potentially werewolves)
* Commands: \`/curse\``,
  },
  {
    label: "Chaos Demon",
    tag: characters.CHAOS_DEMON,
    emoji: "😈",
    team: "chaos",
    description: `### Chaos Demon
* The first night the Chaos Demon will pick any player. For the Chaos Demon to win they must convince the town to hang the target player. If the target dies any other way the chaos demon will die. The Chaos demon is on their own team. Change the allow_chaos_demon setting to true to add this player in the game.
* Channels: none
* Commands: \`/chaos_target\``,
  },
  {
    label: "Vampire King",
    tag: characters.VAMPIRE,
    emoji: "🧛",
    team: "vampire",
    description: `### Vampire King
* The Vampire King is the first vampire. The first night, (s)he chooses someone to bite. That player is immediately turned into a vampire. After that, each player will take two successful bites to turn into a vampire. If the Vampire King tries to bite a werewolf, the attack will fail. Change the allow_vampires setting to true to add this player in the game.
* Channels: vampires
* Commands: \`/vampire_bite\``,
  },
],

module.exports = {
  playerRolesIntro: "# Player Roles",
  characterSelectionIntro: `## Character Selection\nSelect characters for the next game`,
  characterData: roles,
  roleList: [
    {
      label: "View All",
      team: "All",
      emoji: "👀",
      description: "# All roles",
    },
    ...roles,
    {
      label: "Vampire",
      emoji: "🧛",
      team: "vampire",
      description: `### Vampire
  * A vampire is a player that has been turned into a vampire. (S)he will be a vampire in addition to whatever roll (s)he started with. Each night, a vampire may attack a player. It takes two bites to turn a player into a vampire. If a vampire attacks a werewolf or targets the same player as the werewolves, (s)he will die. Change the allow_vampires setting to true to add this player in the game.
  * Channels: vampires
  * Commands: \`/vampire_bite\``,
    },
  ],
  selectCharacterList: [
    {
      label: "Select All",
      tag: "select-all",
      team: "All",
      emoji: "🧑‍🧑‍🧒‍🧒",
      description: "# Select all characters",
    },
    ...roles,
  ]
};