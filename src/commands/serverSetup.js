const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { permissionCheck } = require("../util/permissionCheck");
const {
  setupRoles,
  isAdmin,
  getRole,
  roleNames,
} = require("../util/rolesHelpers");
const { findSettings, createSettings } = require("../werewolf_db");
const { createChannel } = require("../util/channelHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.SERVER_SETUP)
    .setDescription("ADMIN COMMAND: Sets up the server's roles and settings"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const settings = await findSettings(interaction.guild?.id);
    const deniedMessage = await permissionCheck({
      interaction,
      guildOnly: true,
      check: () => settings && !isAdmin(interaction.member),
    });

    if (deniedMessage) {
      await interaction.editReply({
        content: deniedMessage,
        ephemeral: true,
      });
      return;
    }

    await interaction.client.application.fetch();
    await setupRoles(interaction);

    const channels = await interaction.guild.channels.fetch();
    const adminRole = await getRole(interaction, roleNames.ADMIN);
    const adminPermissions = {
      id: adminRole.id,
      allow: ["ADMINISTRATOR"],
    };
    const nonPlayersPermissions = {
      id: interaction.guild.id,
      deny: ["SEND_MESSAGES", "ADD_REACTIONS"],
      allow: ["VIEW_CHANNEL"],
    };

    const howToPlayChannelName = "how-to-play";
    const commandsChannelName = "commands";
    let howToPlayChannel;
    let commandsChannel;

    channels.map(async (channel) => {
      if (channel.name === howToPlayChannelName) {
        howToPlayChannel = channel;
      } else if (channel.name === commandsChannelName) {
        commandsChannel = channel;
      }
    });

    if (!howToPlayChannel) {
      howToPlayChannel = await createChannel(
        interaction,
        howToPlayChannelName,
        [adminPermissions, nonPlayersPermissions]
      );
      await howToPlayChannel.send(howToPlayIntro);
      await howToPlayChannel.send(howToPlay1);
      await howToPlayChannel.send(howToPlay2);
      await howToPlayChannel.send(howToPlay3);
      await howToPlayChannel.send(howToPlay4);
    }

    if (!commandsChannel) {
      commandsChannel = await createChannel(interaction, commandsChannelName, [
        adminPermissions,
        nonPlayersPermissions,
      ]);
      await commandsChannel.send(commands1);
      await commandsChannel.send(commands2);
      await commandsChannel.send(commands3);
    }

    if (!settings) {
      await createSettings({
        server_name: interaction.guild.name,
        guild_id: interaction.guild.id,
        day_time: "8:00",
        night_time: "20:00",
        can_whisper: true,
        allow_reactions: false,
        extra_characters: false,
        show_scoreboard: false,
        wolf_kills_witch: false,
        // vampire settings
        allow_vampires: false,
        allow_first_bite: false,
        always_bite_two: false,
        king_bite_wolf_safe: false,
        king_victim_attack_safe: true,
      });
    }
    await interaction.editReply({
      content: "Server is READY!",
      ephemeral: true,
    });
  },
};

const howToPlayIntro = `
Werewolf is a game with night and day cycles. During the night the werewolves will target a player to kill and during the day all players will vote on who they think is a werewolf. The night and day cycles are in real time. Night is at 8pm MST and day starts at 8am MST. Some characters will have special abilities that they can use in the game. There are two teams in werewolf the Villagers and the Werewolves. The Villagers want to find out who the Werewolves are and hang them. The Werewolves want to eat all the Villagers. The game will end when there is no more werewolves or the werewolves are grater or equal to the villagers. When someone dies they will be given the Dead role. They can no longer help in the game but they can still watch in the after life.

When there is a tie in the votes the bot will pick someone from the tie at random.
`;

const howToPlay1 = `**Villager** +2 Villager Team
> _They can vote to hang someone in the town square during the day. They are trying to find out who are the werewolves so they can stop being eaten by them by killing them first._

**Werewolf** -6 Werewolf Team
> _They want to eat villagers. They can also vote in the town square during the day. At night they are a werewolf and can talk to the other werewolves to target villagers. They want to eat as much villagers as they can without getting caught._

**Bodyguard** +4 Villager Team
> _AKA: vampire hunter! They can do the same things as a villager but at night they can guard a player. If the werewolves or vampires target this player they will be protected and no one will die that night. If the body guard protects a vampire they will find out that the player is a vampire. If a bodyguard protects a player from an attack they will know the vampire who tried to attack the player. If the bodyguard guards the witch they will be told they are a vampire._

**SEER** +5 Villager Team
> _They can do the same things as a villager but at night they can choose someone to investigate and find out what character they are, Villager or Werewolf. The seer is powerful and the werewolves want to kill them as fast as possible. They are not able to tell if a villager is a vampire_

**MASON** +3 Villager Team
> _They are a secret group among the villagers. Everyone in this super cool group is not a werewolf. There can be up to two masons at the start. If a bodyguard uses the guard power on one of them they also join the super cool group. They want to help the villagers get rid of the werewolves but also keep there group a secret because no one else can be trusted._
______`;
const howToPlay2 = `**LYCAN** -3 Villager Team
> _They have the lycan gene. When a seer investigates them the spirits are confused and mistake them as a werewolf instead of a villager. Only the player with this character will know they are the lycan. Even when they die it will say they died as a villager._

**APPRENTICE SEER** +6 Villager Team
> _They are a seer in training. They can't do much at first but when the seer dies they have a chance to replace them as the new seer and be able to pick up where they left off seeing all past investigations. If the fool is still alive when the seer dies the fool and seer character will be shuffled and the apprentice or the fool might become the seer and the other will become the fool._

**FOOL** +2 Villager Team
> _The fool is told they are the seer but they are the fool. When they use the \`/see\` command they will get a random answer back. The fool and the seer will be in the same channel. Together they will have to decide who is right and who is wrong. The fool is on the villager side._

**BAKER** -6 Villager Team
> _The baker makes all the bread for the village. If the baker dies the villagers start to starve to death. After the death of a baker every morning a random villager will die. The werewolves and the witch will not starve. The vampires will also not die because they drink blood_

**HUNTER** +4 Villager Team
> _The hunter is a normal villager but when attacked or hanged they will get injured and have a small amount of time to live. During this time they will be able to shoot one other player using the \`/shoot\` command. Hopefully you shoot a werewolf._
______`;
const howToPlay3 = `**CURSED VILLAGER** -5
> _The cursed villager is told they are one of the following, normal villager, hunter, lycan, or baker but if they are killed by the werewolves they will turn into a werewolf themselves. They will have the same ability to kill like the werewolves. If they are bitten by a vampire they will turn into a vampire king. As a cursed Villager they are on the villager team_

**WEREWOLF CUB** -7 Werewolf Team
> _They are a baby werewolf and have the same abilities as a normal werewolf. The other werewolves will become enraged if you die and will be able to kill two villagers for the next night. The Werewolf Cub will be told they are a regular werewolf._

**DOPPELGANGER** 0
> _They don't know what team they are on yet. Use the \`/copy\` command to copy another player's character. You will now become that character and be on that team. If you don't use the copy command the bot will pick someone for you. You will play the rest of the game as this character._

**WITCH** -5 Werewolf Team
> _They are on the werewolf team but they don't know what players are the werewolves and the werewolves don't know which player is the witch. Every night they will be able to curse a player. The curse does nothing until the witch dies. If the villagers hang the witch everyone who is cursed dies. Werewolves do not die from the curse. If the werewolves try to target a witch they will not kill them and find out which player is the witch. The only way for the witches curse to fail is if they are shot by the hunter or if they starve. If the bodyguard guards the witch they will be told the witch is a vampire to help the witches changes of being lynched. The seer will see them as a villager_
______`;
const howToPlay4 = `**VAMPIRE** Vampire Team
> _Vampires will be on their own team and they will have the ability to bite a player during the night. There are two types of vampires. The vampire king or a villager that is turned into a vampire. The starting vampire is a vampire king. If a cursed villager is turned they will also be a vampire king. A villager that is turned into a vampire will have the same abilities and be on the same channel. They will be added to the vampire chat and gain the ability to bite using the 'vampire_bite' command. A vampire will need to bite a player two times for the player to transform into a vampire. The players that can not be transform into a vampire are the bodyguard, witch, and the werewolves. If a vampire tries to bite a werewolf they will die. If a vampire ties to bite a player that will die from the werewolves they will also die. If the vampires bite a player that was guarded or players that can't be transformed it will say "They must have been protected or are able to defend your attacks"

Settings for vampires that can be turned off or on.
* The vampire kings first bite will transform a player into a vampire.
* Only one bite from a vampire king will transform a player into a vampire.
* The vampire king will not die when biting the same victim as the werewolves. It will say they are protected or can defend their attacks._
* The vampire king will not die when biting a werewolf. It will say they are protected or can defend their attacks.
`;

const commands1 = `
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
_____`;
const commands2 = `
**/guard** (target)
> This is a **Bodyguard** command. It is used at night in the bodyguard channel to guard an alive player. If a werewolf targets this player they will not die. If someone is going to get hanged the guard can not save them. Use by type the command and hitting enter and choosing a player to guard.

**/see** (target)
> This is a **Seer** command. It is used at night in the seer channel to investigate an alive player. After selecting a player the Werewolf Bot will tell you if that player is a werewolf or not. Use by type the command and hitting enter and choosing a player to investigate

**/shoot** (target)
> This is the **Hunters** command. When a hunter is injured they will be able to use this command to shoot someone. If they forget to shoot then the bot will shoot for them. After shooting the hunter will die along with the player they shot.

**/whisper** (player) (message)
> Players can use this command to talk to other players in private. (dead and non players will be able to see what is being said) The message will be sent by the bot and it will also display in the after life for dead to see.

**/curse** (target)
> This is the **Witch** command. Use it in the witch channel. Uses this command to select who will be cursed. If you change your mind use the command on a different player. The curse will be final when it becomes day. If the witch dies from the villagers then whoever is cured will die except werewolves and vampires.
_____`;
const commands3 = `
**/vampire_bite** (target)
> This is the **Vampires** command. Use it in the vampire channel. Each vampire is able to bite one other player each night. When a villager is bitten twice they turn into a vampire and are able to use this command. If they try to bite a werewolf or bite the same target as the werewolves they will die except the first vampire (vampire king).

**/copy** (target)
> This is the **Doppelganger** command. Use it to copy a players character and become that charter the next day. This command only works on the first day/night and will not work after that. If the doppelganger does not use the bot will pick a character for them. This command can be used anywhere and will keep the bot reply private. You can change your target multiply times before the next day.
`;
