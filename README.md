# Discord Werewolf Bot

This bot will be the narrator for the game werewolf in a discord server. Players will use commands from the bot to make 
actions in the game. A player can be on the villagers team or the werewolves team. There are options to add other teams 
like the vampires. Every night the werewolves attack and eat one villager. During the day the villagers vote for a 
player to be hanged. The villagers do not know who is on the villager team or the werewolf team. They will have to find 
out who the werewolves are and vote for them. The werewolves do know who is on their team. They try to act like a 
villager and survive from the vote. The werewolves win if the number of werewolves are equal or grater than the 
villagers plus any other teams playing (vampires). The villager will win when they killed all the werewolves and other 
teams (vampires). The game is in real time. The day and voting will end at 8pm and the night will end at 8am. During the
day the villagers and werewolves will vote. During the night the werewolves will talk, in a private chanel, on who to 
target.

## Setup and Development

See [Setup Instructions](./SETUP.md)

## Characters

**Villager** +2 Villager Team

> _They can vote to hang someone in the town square during the day. They are trying to find out who are the werewolves so they can stop being eaten by them by killing them first._

**Werewolf** -6 Werewolf Team

> _They want to eat villagers. They can also vote in the town square during the day. At night they are a werewolf and can talk to the other werewolves to target villagers. They want to eat as much villagers as they can without getting caught._

**Bodyguard** +4 Villager Team

> _AKA: vampire hunter! They can do the same things as a villager but at night they can guard a player. If the werewolves or vampires target this player they will be protected and no one will die that night. If the body guard protects a vampire they will find out that the player is a vampire. If a bodyguard protects a player from an attack they will know the vampire who tried to attack the player. If the bodyguard guards the witch they will be told they are a vampire._

**SEER** +5 Villager Team

> _They can do the same things as a villager but at night they can choose someone to investigate and find out what character they are, Villager or Werewolf. The seer is powerful and the werewolves want to kill them as fast as possible. They are not able to tell if a villager is a vampire_

**MASON** +3 Villager Team

> _They are a secret group among the villagers. Everyone in this super cool group is not a werewolf. There can be up to two masons at the start. If a bodyguard uses the guard power on one of them they also join the super cool group. They want to help the villagers get rid of the werewolves but also keep there group a secret because no one else can be trusted._

**LYCAN** -4 Villager Team

> _They have the lycan gene. When a seer investigates them the spirits are confused and mistake them as a werewolf instead of a villager. OThe lycan is told they are a villager but when they died it will say they are a lycan._

**APPRENTICE SEER** +6 Villager Team

> _They are a seer in training. They can't do much at first but when the seer dies they have a chance to replace them as the new seer and be able to pick up where they left off seeing all past investigations. If the fool is still alive when the seer dies the fool and seer character will be shuffled and the apprentice or the fool might become the seer and the other will become the fool._

**FOOL** +2 Villager Team

> _The fool is told they are the seer but they are the fool. When they use the `/investigate` command they will get a random answer back. The fool and the seer will be in the same channel. Together they will have to decide who is right and who is wrong. The fool is on the villager side._

**BAKER** -6 Villager Team

> _The baker makes all the bread for the village. If the baker dies the villagers start to starve to death. After the death of a baker every morning a random villager will die. The werewolves and the witch will not starve. The vampires will also not die because they drink blood_

**HUNTER** +4 Villager Team

> _The hunter is a normal villager but when attacked or hanged they will get injured and have a small amount of time to live. During this time they will be able to shoot one other player using the `/shoot` command. Hopefully you shoot a werewolf._

**MUTATED VILLAGER** -5

> _The mutated villager is told they are one of the following, normal villager, hunter, lycan, or baker but if they are killed by the werewolves they will turn into a werewolf themselves. They will have the same ability to kill like the werewolves. If they are bitten by a vampire they will turn into a vampire king. As a mutated Villager they are on the villager team_

**WEREWOLF CUB** -7 Werewolf Team

> _They are a baby werewolf and have the same abilities as a normal werewolf. The other werewolves will become enraged if you die and will be able to kill two villagers for the next night. The Werewolf Cub will be told they are a regular werewolf._

**DOPPELGANGER** 0

> _They don't know what team they are on yet. Use the `/copy` command to copy another player's character. You will now become that character and be on that team. If you don't use the copy command the bot will pick someone for you. You will play the rest of the game as this character._

**WITCH** -5 Werewolf Team

> _They are on the werewolf team but they don't know what players are the werewolves and the werewolves don't know which player is the witch. Every night they will be able to curse a player. The curse does nothing until the witch dies. If the villagers hang the witch everyone who is cursed dies. Werewolves do not die from the curse. If the werewolves try to target a witch they will not kill them and find out which player is the witch. The only way for the witches curse to fail is if they are shot by the hunter or if they starve. If the bodyguard guards the witch they will be told the witch is a vampire to help the witches changes of being lynched. The seer will see them as a villager_

**VAMPIRE** Vampire Team

> _They will be on their own team and they will have the ability to suck blood. If they try to bite a werewolf they will die. Every night they will be able to suck someones blood by using the 'vampire_bite' command. After 2 bites that villager will become a vampire. They can also suck blood and have the same role they use to have. If the werewolves pick the same villager that the vampire is feasting on the villager and vampire will die. If they are the vampire king (the first vampire) they will not die from getting in the way of the werewolves pray. The vampire kings first bite will transform a player into a vampire. Vampires will not be able to bite the witch or the bodyguard. It will say they are guarded or can defend your attacks_

**GROUCHY GRANNY** Villager Team +4
> _Grouchy grannies are on the villager team but the villagers wish they were not. Every day a grumpy granny picks a player to remove from the game for the rest of the day and night. They are not allowed to talk but can still watch what is happening. They can use the /mute command only during the day. When a player is muted they will not be able to use commands so they lose their night ability if they have one._
# Commands

Commands are actions you can do in the game. To browse the commands type **/** in discord at the start of your message. A list should pop up with all the commands. Continue to type to search for a command.

**/playing**

> This is how you let the werewolf bot know you want to play the next round. It will give you the Playing role. There needs to be 5 players to start the game.

**/stop_playing**

> If you decide you don't want to play use this command and it will remove the Playing role.

**/vote** (user)

> When you are have the Alive Role you will be able to use the '/vote' command. The vote command only works during the day. To use select the command and hit enter. You will then see options to select a user. Select a user with the Alive Role to vote for them to be hanged. This is the best way the village could think of to decide who should die. Daily hanging is at 8pm MST who ever gets the most votes gets the noose.

**/show votes**

> This will show the current vote status in the game. It will show the players name and the vote count next to it.

**/show voters_for** (player _optional_)

> Shows who voted for who. Can target a user or run without a target to see who everyone voted for.

**/who_is_alive**

> Shows who is alive in the game. This will also show the number of werewolf and villagers left in the game.

**/kill** (target)

> This is a **Werewolf** command. It is used at night in the werewolf channel to target an alive player to die. You may change your target using this same command. Use by typing the command hitting enter and choosing a player to kill.

**/guard** (target)

> This is a **Bodyguard** command. It is used at night in the bodyguard channel to guard an alive player. If a werewolf targets this player they will not die. If someone is going to get hanged the guard can not save them. Use by type the command and hitting enter and choosing a player to guard.

**/investigate** (target)

> This is a **Seer** command. It is used at night in the seer channel to investigate an alive player. After selecting a player the Werewolf Bot will tell you if that player is a werewolf or not. Use by type the command and hitting enter and choosing a player to investigate

**/shoot** (target)

> This is the **Hunters** command. When a hunter is injured they will be able to use this command to shoot someone. If they forget to shoot then the bot will shoot for them. After shooting the hunter will die along with the player they shot.

**/mute** (player)
> This is the Grouchy Granny command. Use it in the town square channel. Can be used any time during the day. It will last the rest of the day and through the night. The mute will be removed the next morning. This will stop a player from using a night power. eg (seer will not be able to use see or vampire will not be able to bite)

**/whisper** (player) (message)

> Players can use this command to talk to other players in private. (dead and non players will be able to see what is being said) The message will be sent by the bot and it will also display in the after life for dead to see.

**/curse** (target)

> This is the **Witch** command. Use it in the witch channel. Uses this command to select who will be cursed. If you change your mind use the command on a different player. The curse will be final when it becomes day. If the witch dies from the villagers then whoever is cured will die except werewolves and vampires.

**/vampire_bite** (target)

> This is the **Vampires** command. Use it in the vampire channel. Each vampire is able to bite one other player each night. When a villager is bitten twice they turn into a vampire and are able to use this command. If they try to bite a werewolf or bite the same target as the werewolves they will die except the first vampire (vampire king).

**/copy** (target)

> This is the **Doppelganger** command. Use it to copy a players character and become that charter the next day. This command only works on the first day/night and will not work after that. If the doppelganger does not use the bot will pick a character for them. This command can be used anywhere and will keep the bot reply private. You can change your target multiply times before the next day.

# Admin Commands

**/server_setup**

> This sets up the discord server. It adds the admin, playing, alive, and dead roles to discord and it adds the instructions on how to play. It also sets up the settings for the server.

**/start_game**

> When everyone who wants to play is marked with the playing role an admin may run this command to start the game. The bot will mark players from the playing role to the alive role. It will assign the players a character randomly and create all the channels and permissions for the game.

**/end**

> This will end the current game and delete all channels and permissions and remove Alive and Dead roles from players.

**/day_time**

> sets the game into day time and runs the day code to see if anyone died from the night.

**/night_time**

> sets the game into night time and runs the night code to see who had the most votes to kill.

**/reset_scheduling**

> When the bot goes offline the day and night schedulers get turned off. This will reset the scheduling so day and night time will happen according to the settings in the database.


