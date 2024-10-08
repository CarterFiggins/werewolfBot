module.exports = {
  howToPlayIntro: `# How to Play

The goal of Werewolf is to eliminate players on other teams, with a secondary goal to be alive at the end of the game. There are three possible teams in Werewolf: Werewolves, Vampires, and Villagers. This version of werewolf takes place in real time. During daytime hours, players that are alive may vote to hang another player. At nightfall, the player with the most votes is hanged. If there is a tie, the bot will randomly pick to hang one person from among those with the most votes.

At night, the werewolves decide to target a player and try to kill and eat them. Additionally, each vampire chooses a player to target to suck blood from. Each villager takes two bites to be changed into a vampire, and the first strike of the vampire king counts as two bites. If a vampire tries to drink blood from a werewolf, they will die. Werewolves and vampires will succeed in their attacks unless blocked by the bodyguard. Vampires are unable to bite the bodyguard.

Villagers win when all werewolves and vampires are dead. Werewolves and vampires win when they equal or outnumber the rest of the players. When someone dies, they will be given the dead role. They can no longer speak in channels with alive players, but they can spectate and chat with other dead people in the afterlife.
  `,

  howToPlayRoles: `# Roles

_All alive players can communicate in the town square and vote to lynch a player during the day. Dead players can see all channels but only communicate in the afterlife._
  `,
  orderOfOperations: `# Order of night commands
1. Bodyguard protects target
2. Vampires bites target
3. Werewolf kills target
4. Witch curses a target
5. Player returns from being muted
6. Seer investigates target
7. Monarch gives target power
8. Grouchy granny mutes a player
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
* Monarch
* Mutated Villager (Until attacked by werewolf)
  `,

  werewolfTeam: `## WerewolfTeam
* Werewolf
* Werewolf Cub
* Witch
  `,

  vampireTeam: `## Vampire Team
* Vampire King
  `,
  soloCharacters: `## Solo Characters
* Chaos Demon
  `,

  undeterminedTeam: `## Undetermined Team
* Doppelganger
  `,
}