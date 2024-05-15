const _ = require("lodash");
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
const { howToPlayIntro, howToPlayRoles, villagerTeam, villagerRoleList, werewolfTeam, vampireTeam, undeterminedTeam, otherRoleList } = require("../util/botMessages/howToPlay");
const { PermissionsBitField } = require("discord.js");

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
      allow: [PermissionsBitField.Flags.Administrator],
    };
    const nonPlayersPermissions = {
      id: interaction.guild.id,
      deny: [
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags. CreatePrivateThreads,
        PermissionsBitField.Flags. CreatePublicThreads,
        PermissionsBitField.Flags. SendMessagesInThreads,
      ],
      allow: [PermissionsBitField.Flags.ViewChannel],
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
      await howToPlayChannel.send(howToPlayRoles);
      await howToPlayChannel.send(villagerTeam);

      const villagerRolesThread = await howToPlayChannel.threads.create({
        name: 'Villager Team Roles',
      });
      
      await Promise.all(_.map(villagerRoleList, async (role) => {
        await villagerRolesThread.send(role)
      }));

      await howToPlayChannel.send(werewolfTeam);
      await howToPlayChannel.send(vampireTeam);
      await howToPlayChannel.send(undeterminedTeam);

      const otherRolesThread = await howToPlayChannel.threads.create({
        name: 'Other Roles',
      });
      
      await Promise.all(_.map(otherRoleList, async (role) => {
        await otherRolesThread.send(role)
      }));
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
        random_cards: false,
        hard_mode: false,
        bodyguard_joins_masons: true,
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

**/investigate** (target)
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

**/mute** (player)
> This is the **Grouchy Granny** command. Use it in the town square channel. Can be used any time during the day. It will last the rest of the day and through the night. While the player is muted they will be able to leave massages on the out cast channel. The mute will be removed the next morning and the granny will not be able to mute them again. This will stop a player from using a night power. eg (seer will not be able to use see or vampire will not be able to bite)
`;
