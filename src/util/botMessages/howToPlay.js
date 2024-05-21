module.exports = {
  howToPlayIntro: `# How to Play

The goal of Werewolf is to eliminate players on other teams, with a secondary goal to be alive at the end of the game. There are three possible teams in Werewolf: Werewolves, Vampires, and Villagers. This version of werewolf takes place in real time.  Night falls at 8 pm MST and dawn breaks at 8 am MST. During daytime hours, players that are alive may vote to hang another player. At nightfall, the player with the most votes is hanged. If there is a tie, the bot will randomly pick to hang one person from among those with the most votes.

At night, the werewolves decide to target a player and try to kill and eat them. Additionally, each vampire chooses a player to target to suck blood from. Each villager takes two bites to be changed into a vampire, and the first strike of the vampire king counts as two bites. If a vampire tries to drink blood from a werewolf, they will die. Werewolves and vampires will succeed in their attacks unless blocked by the bodyguard. Vampires are unable to bite the bodyguard.

Villagers win when all werewolves and vampires are dead. Werewolves and vampires win when they equal or outnumber the rest of the players. When someone dies, they will be given the dead role. They can no longer speak in channels with alive players, but they can spectate and chat with other dead people in the afterlife.
  `,

  howToPlayRoles: `# Roles

_All alive players can communicate in the town square and vote to lynch a player during the day. Dead players can see all channels but only communicate in the afterlife._
  `,

  villagerTeam: `## Villager Team
* Villager
* Bodyguard
* Seer
* Fool
* Apprentice Seer
* Mason
* Baker
* Hunter
* Grouchy Granny
* Lycan
* Cursed Villager
  `,

  werewolfTeam: `## WerewolfTeam
* Werewolf
* Werewolf Cub
* Witch
  `,

  vampireTeam: `## Vampire Team
* Vampire King
  `,

  undeterminedTeam: `## Undetermined Team
* Doppelganger
  `,


  roleList: [
    {
      label: 'Villager',
      team: 'villager',
      emoji: '🧑‍🌾',
      description: `### Villager
* A regular villager.
* Channels: none
* Commands: none`,
    },
    {
      label: 'Bodyguard',
      emoji: '💂',
      team: 'villager',
      description: `### Bodyguard
* At night, the bodyguard may guard a player. If the guarded player is targeted, the attack will fail. If the bodyguard protects a vampire, (s)he will find out that the player is a vampire. If a bodyguard protects a player from an attack, (s)he will know the vampire who tried to attack the player. If the bodyguard guards the witch, (s)he will be told the witch is a vampire.
* Channels: bodyguard (potentially mason)
* Commands: \`/guard\``,
    },
    {
      label: 'Seer',
      emoji: '🔮',
      team: 'villager',
      description: `### Seer
* At night the seer may choose someone to investigate. Lycans and werewolves will appear as werewolves and vampires and villagers will appear as villagers.
* Channels: seer
* Commands: \`/investigate\``
    },
    {
      label: 'Fool',
      emoji: '🤡',
      team: 'villager',
      description: `### Fool 
* The fool is told (s)he is the seer but when investigating, (s)he will receive a random answer. The fool and the seer are in the same channel, and together they figure out which of them is the real seer.
* Channels: seer
* Commands: \`/investigate\``
    },
    {
      label: 'Apprentice Seer',
      emoji: '🪄',
      team: 'villager',
      description: `### Apprentice Seer
* The apprentice seer takes over the seer role if the seer is killed. If the fool is still alive when the seer dies, the fool and seer characters will be shuffled. The apprentice may become the fool or the seer, and the former fool will take the other role.
* Channels: seer
* Commands \`/investigate\``},

    {
      label: 'Mason',
      emoji: '🤵',
      team: 'villager',
      description: `### Mason
* The masons are a secret group of villagers with no powers aside from being in this exclusive club. If the bodyguard guards a mason, the bodyguard will join the group. They work together to determine which other villagers can be trusted.
* Channels: mason
* Commands: none`
    },
    {
      label: 'Baker',
      emoji: '🧑‍🍳',
      team: 'villager',
      description: `### Baker
* The baker makes bread for the village. If the baker dies, the villagers start to starve to death. After the death of the baker, one villager will die every morning. The werewolves, the vampires, and the hunter(s) will not starve.
* Channels: none
* Commands: none`
    },
    {
      label: 'Hunter',
      emoji: '🔫',
      team: 'villager',
      description: `### Hunter
* When the hunter is killed, whoever they have been targeting will be shot and killed. The hunter is immune to starvation.
* Channels: hunting-party
* Commands: \`/shoot\``
    },
    {
      label: 'Lycan',
      emoji: '🌝',
      team: 'villager',
      description: `### Lycan
* Lycans will be told they are regular villagers. However, they will appear to the seer as werewolves.
* Channels: none
* Commands: none`
    },
    {
      label: 'Grouchy Granny',
      emoji: '👵',
      team: 'villager',
      description: `### Grouchy Granny
    * The grouchy granny is a villager. Each night, she can choose to mute one player, preventing them from speaking the next day and stops them from using their power.
    * Channels: out-casts
    * Commands: \`/mute\``
    },
    {
      label: 'Mutated Villager',
      emoji: '☣️',
      team: 'villager/werewolf',
      description: `### Mutated Villager
* A mutated villager will be told (s)he is a regular villager and is initially on the villager team. If attacked by a werewolf, the mutated villager will turn into a werewolf. If bitten by a vampire, the mutated villager will turn into a vampire king.
* Channels: none
* Commands: none`
    },
    {
      label: 'Werewolf',
      emoji: '🐺',
      team: 'werewolf',
      description: `### Werewolf
* Werewolves appear as regular villagers during the day, but turn into bloodthirsty monsters at night. Each night, the pack of werewolves decide amongst themselves who to target that night. One werewolf uses the command.
* Channels: werewolves
* Commands: \`kill\``,
    },
    {
      label: 'Werewolf Cub',
      emoji: '🐺',
      team: 'werewolf',
      description: `### Werewolf Cub
* The werewolf cub is a baby werewolf. When the werewolf cub is lynched, the remaining werewolves can use the kill command twice the following night.
* Channels: werewolves
* Commands: \`kill\``,
    },
    {
      label: 'Doppelganger',
      emoji: '©️',
      team: 'unknown',
      description: `### Doppelganger
* During the first night, the doppelganger may copy another player and become that role. The player copied is unaware (s)he was copied
* Channels: same as the copied player
* Commands: \`copy\``,
    },
    {
      label: 'Witch',
      emoji: '🧙',
      team: 'werewolf',
      description: `### Witch
* Each night, the witch chooses someone to curse. If the witch is lynched, all players that the witch has cursed will die. The curse will not affect werewolves. The witch will appear as a vampire to the bodyguard. If the werewolves try to target the witch the witch will join werewolves.
* Channels: witch (potentially werewolves)
* Commands: \`/curse\``,
    },
    {
      label: 'Vampire King',
      emoji: '🧛',
      team: 'vampire',
      description: `### Vampire King
* The Vampire King is the first vampire. The first night, (s)he chooses someone to bite. That player is immediately turned into a vampire. After that, each player will take two successful bites to turn into a vampire. If the Vampire King tries to bite a werewolf, the attack will fail.
* Channels: vampires
* Commands: \`/vampire_bite\``,
    },
    {
      label: 'Vampire',
      emoji: '🧛',
      team: 'vampire',
      description: `### Vampire
* A vampire is a player that has been turned into a vampire. (S)he will be a vampire in addition to whatever roll (s)he started with. If a vampire attacks a werewolf, (s)he will die.
* Channels: vampires
* Commands: \`/vampire_bite\``,
    },
  ],
}