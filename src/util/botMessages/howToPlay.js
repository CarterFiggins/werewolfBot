// IF WE WANT TO MAKE THREADS

//https://discord.js.org/docs/packages/discord.js/14.15.2/GuildTextThreadManager:Class#create

module.exports = {
  howToPlayIntro: `# How to Play

The goal of Werewolf is to eliminate players on other teams, with a secondary goal to be alive at the end of the game. There are three possible teams in Werewolf: Werewolves, Vampires, and Villagers. This version of werewolf takes place in real time.  Night falls at 8 pm MST and dawn breaks at 8 am MST. During daytime hours, players that are alive may vote to hang another player. At nightfall, the player with the most votes is hanged. If there is a tie, the bot will randomly pick to hang one person from among those with the most votes.

At night, the werewolves decide to target a player and try to kill and eat them. Additionally, each vampire chooses a player to target to suck blood from. Each villager takes two bites to be changed into a vampire, and the first strike of the vampire king counts as two bites. If a vampire tries to drink blood from a werewolf, they will die. Werewolves and vampires will succeed in their attacks unless blocked by the bodyguard. Vampires are unable to bite the bodyguard.

Villagers win when all werewolves and vampires are dead. Werewolves and vampires win when they equal or outnumber the rest of the players. When someone dies, they will be given the dead role. They can no longer speak in channels with alive players, but they can spectate and chat with other dead people in the afterlife.
  `,

  howToPlayRoles: `# Roles

All alive players can communicate in the town square and vote to lynch a player during the day. Dead players can see all channels but only communicate in the afterlife.
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


  villagerRoleList: [`### Villager
* A regular villager.
* Channels: none
* Commands: none
  
### Bodyguard
* At night, the bodyguard may guard a player. If the guarded player is targeted, the attack will fail. If the bodyguard protects a vampire, (s)he will find out that the player is a vampire. If a bodyguard protects a player from an attack, (s)he will know the vampire who tried to attack the player. If the bodyguard guards the witch, (s)he will be told the witch is a vampire.
* Channels: bodyguard (potentially mason)
* Commands: \`/guard\`

### Seer
* At night the seer may choose someone to investigate. Lycans and werewolves will appear as werewolves and vampires and villagers will appear as villagers.
* Channels: seer
* Commands: \`/investigate\`

### Fool 
* The fool is told (s)he is the seer but when investigating, (s)he will receive a random answer. The fool and the seer are in the same channel, and together they figure out which of them is the real seer.
* Channels: seer
* Commands: \`/investigate\`

### Apprentice Seer
* The apprentice seer takes over the seer role if the seer is killed. If the fool is still alive when the seer dies, the fool and seer characters will be shuffled. The apprentice may become the fool or the seer, and the former fool will take the other role.
* Channels: seer
* Commands \`/investigate\`

### Mason
* The masons are a secret group of villagers with no powers aside from being in this exclusive club. If the bodyguard guards a mason, the bodyguard will join the group. They work together to determine which other villagers can be trusted.
* Channels: mason
* Commands: none
`,
`
### Baker
* The baker makes bread for the village. If the baker dies, the villagers start to starve to death. After the death of the baker, one villager will die every morning. The werewolves, the witch, the vampires, and the hunter(s) will not starve.
* Channels: none
* Commands: none

### Hunter
* When the hunter is killed, whoever they have been targeting will be shot and killed. The hunter is immune to starvation.
* Channels: hunting-party
* Commands: /shoot

### Lycan
* Lycans will be told they are regular villagers. However, they will appear to the seer as werewolves.
* Channels: none
* Commands: none

### Cursed Villager
* A cursed villager will be told (s)he is a regular villager and is initially on the villager team. If attacked by a werewolf, the cursed villager will turn into a werewolf. If bitten by a vampire, the cursed villager will turn into a vampire king.
* Channels: none
* Commands: none
`,
],
}