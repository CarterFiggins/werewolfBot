const { showAllPowerUpMessages } = require("../commandHelpers");

module.exports = {
  commandsIntro: `# Commands

Commands are actions you can do in the game. To browse the commands type **/** in discord at the start of your message. A list should pop up with all the commands. Continue to type to search for a command.
  `,
  commandList: [
    {
      label: 'View All',
      role: 'All',
      emoji: '👀',
      description: '# All Commands'
    },
    {
      label: '/playing',
      role: 'everyone',
      emoji: '▶️',
      description: `### /playing
This is how you let the werewolf bot know you want to play the next round. It will give you the Playing role. There needs to be 5 players to start the game.`
    },
    {
      label: '/stop_playing',
      role: 'everyone',
      emoji: '⏹️',
      description: `### /stop_playing
If you decide you don\`t want to play use this command and it will remove the Playing role.`
    },
    {
      label: '/join_the_dead',
      role: 'everyone',
      emoji: '👁️',
      description: `### /join_the_dead
Join the dead when a game has already started so you can talk about what is happening in the game.`
    },
    {
      label: '/vote (target)',
      role: 'everyone',
      emoji: '✉️',
      description: `### /vote (target)
When you are have the Alive Role you will be able to use the \'/vote\' command. The vote command only works during the day. To use select the command and hit enter. You will then see options to select a user. Select a user with the Alive Role to vote for them to be hanged. This is the best way the village could think of to decide who should die. Daily hanging is at 8pm MST who ever gets the most votes gets the noose.`
    },
    {
      label: '/show votes',
      role: 'everyone',
      emoji: '📬',
      description: `### /show votes
This will show the current vote status in the game. It will show the players name and the vote count next to it.`
    },
    {
      label: '/show voters_for (player optional)',
      role: 'everyone',
      emoji: '💌',
      description: `### /show voters_for (player optional)
Shows who voted for who. Can target a user or run without a target to see who everyone voted for.`
    },
    {
      label: '/who_is_alive',
      role: 'everyone',
      emoji: '🥸',
      description: `### /who_is_alive
Shows you your character in the game`
    },
    {
      label: '/who_am_i',
      role: 'everyone',
      emoji: '❤️',
      description: `### /who_is_alive
Shows who is alive in the game. This will also show the number of werewolf and villagers left in the game.`
    },
    {
      label: '/kill (target)',
      role: 'werewolf, cub',
      emoji: '🗡️',
      description: `### /kill (target)
This is a Werewolf command. It is used at night in the werewolf channel to target an alive player to die. You may change your target using this same command. Use by typing the command hitting enter and choosing a player to kill.`
    },
    {
      label: '/guard (target)',
      role: 'bodyguard',
      emoji: '🛡️',
      description: `### /guard (target)
This is a Bodyguard command. It is used at night in the bodyguard channel to guard an alive player. If a werewolf targets this player they will not die. If someone is going to get hanged the guard can not save them. Use by type the command and hitting enter and choosing a player to guard.`
    },
    {
      label: '/investigate (target)',
      role: 'seer, fool',
      emoji: '🔍',
      description: `### /investigate (target)
This is a Seer and fool\`s command. It is used at night in the seer channel to investigate an alive player. After selecting a player the Werewolf Bot will tell you in the morning if that player is a werewolf or not. Use by type the command and hitting enter and choosing a player to investigate`
    },
    {
      label: '/shoot (target)',
      role: 'hunter',
      emoji: '🔫',
      description: `### /shoot (target)
This is the Hunters command. When a hunter is injured they will be able to use this command to shoot someone. If they forget to shoot then the bot will shoot for them. After shooting the hunter will die along with the player they shot.`
    },
    {
      label: '/whisper (player) (message)',
      role: 'everyone',
      emoji: '🔉',
      description: `### /whisper (player) (message)
Players can use this command to talk to other players in private. (dead and non players will be able to see what is being said in the after-life channel) The message will be sent by the bot and it will also display in the after life for dead to see. You can only whisper once per day. Whispering resets after the day cycle ends`
    },
    {
      label: '/curse (target)',
      role: 'witch',
      emoji: '💀',
      description: `### /curse (target)
This is the Witch command. Use it in the witch channel. Uses this command to select who will be cursed. If you change your mind use the command on a different player. The curse will be final when it becomes day. If the witch dies from the villagers then whoever is cured will die except werewolves and vampires.`
    },
    {
      label: '/vampire_bite (target)',
      role: 'vampire king, vampire',
      emoji: '🧛',
      description: `### /vampire_bite (target)
This is the Vampires command. Use it in the vampire channel. Each vampire is able to bite one other player each night. When a villager is bitten twice they turn into a vampire and are able to use this command. If they try to bite a werewolf or bite the same target as the werewolves they will die except the first vampire (vampire king).`
    },
    {
      label: '/copy (target)',
      role: 'doppelganger',
      emoji: '©️',
      description: `### /copy (target)
This is the Doppelganger command. Use it to copy a players character and become that charter the next day. This command only works on the first day/night and will not work after that. If the doppelganger does not use the bot will pick a character for them. This command can be used anywhere and will keep the bot reply private. You can change your target multiply times before the next day.`
    },
    {
      label: '/mute (target)',
      role: 'grouchy granny',
      emoji: '🔇',
      description: `### /mute (target)
This is the Grouchy Granny command. Use it in the town square channel. Can be used any time during the day. It will last the rest of the day and through the night. While the player is muted they will be able to leave massages on the out cast channel. The mute will be removed the next morning and the granny will not be able to mute them again. This will stop a player from using a night power. eg (seer will not be able to use see or vampire will not be able to bite)`
    },
    {
      label: '/bestow_power (target) (power)',
      role: 'grouchy granny',
      emoji: '🎁',
      description: `### /bestow_power (target) (power)
This is the Monarch command. It is used to give powers to another player. The Monarch can not give powers to themselves because that would be selfish. Powers that can be given.\n${showAllPowerUpMessages()}`
    },
  ]
}