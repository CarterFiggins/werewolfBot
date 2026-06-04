# Adding a New Character/Role

This guide walks through every file you need to touch to add a new character to the game. Follow the steps in order — each section builds on the previous one.

---

## 1. Define the Character Constant

**File:** [src/util/characterHelpers/characterUtil.js](src/util/characterHelpers/characterUtil.js)

Add the character to the `characters` object. The string value is what gets stored in the database and displayed to players.

```js
const characters = {
  // ... existing characters ...
  NEW_CHARACTER: "new character",
};
```

Then register it in `characterInfoMap`:

```js
const characterInfoMap = new Map([
  // ... existing entries ...
  [characters.NEW_CHARACTER, {
    weight: 3,         // 1–6: higher = more likely to be randomly selected
    points: 5,         // how much it balances the team it helps
    helpsTeam: teams.VILLAGER,  // or teams.WEREWOLF / teams.VAMPIRE / teams.CHAOS
    // onlyOne: true,  // uncomment if only one of this character is allowed per game
  }],
]);
```

**Weight guide:**
- `1–2` — rare (Werewolf, Seer, Bodyguard)
- `3–4` — uncommon (Mason, Grouchy Granny, Fool)
- `5–6` — common (Villager, Hunter, Lycan)

If the character should be in the default game (no admin configuration required), also add it to `defaultCharacters`:

```js
defaultCharacters = [
  // ... existing ...
  characters.NEW_CHARACTER,
]
```

---

## 2. Set Up Player Data

**File:** [src/util/userHelpers.js](src/util/userHelpers.js)

The `buildUserInfo()` function creates the base database document for every player. If your character needs extra fields (e.g., a target ID, a counter, a flag), add a `case` for it in the `switch` block inside `crateUserData()`:

```js
switch (newCharacter) {
  // ... existing cases ...
  case characters.NEW_CHARACTER:
    user.info.new_character_target_id = null;
    user.info.new_character_uses = 0;
    break;
}
```

If your character should appear to other players (like the Seer) as a different role, also set `assigned_identity`:

```js
case characters.NEW_CHARACTER:
  user.info.assigned_identity = characters.VILLAGER; // what the Seer sees
  break;
```

---

## 3. Create the Character Helper

**File:** `src/util/characterHelpers/newCharacterHelper.js` *(new file)*

This file contains the logic that runs during the night phase. Follow the pattern used by [bodyguardHelper.js](src/util/characterHelpers/bodyguardHelper.js) or [seerHelper.js](src/util/characterHelpers/seerHelper.js):

```js
const _ = require("lodash");
const { findManyUsers, findUser, updateUser } = require("../../werewolf_db");
const { organizeChannels } = require("../channelHelpers");
const { characters } = require("./characterUtil");

async function executeNewCharacterPower(interaction) {
  const guildId = interaction.guild.id;
  const members = interaction.guild.members.cache;
  const channels = interaction.guild.channels.cache;
  const organizedChannels = organizeChannels(channels);

  const cursor = await findManyUsers({
    guild_id: guildId,
    character: characters.NEW_CHARACTER,
    is_dead: false,
  });
  const newCharacters = await cursor.toArray();

  if (_.isEmpty(newCharacters)) return;

  await Promise.all(
    _.map(newCharacters, async (dbUser) => {
      if (!dbUser.new_character_target_id) return;

      const targetUser = await findUser(dbUser.new_character_target_id, guildId);
      // ... apply your power logic ...

      await updateUser(dbUser.user_id, guildId, {
        new_character_target_id: null,
      });
    })
  );
}

module.exports = { executeNewCharacterPower };
```

---

## 4. Create the Slash Command

**File:** `src/commands/newCommand.js` *(new file)*

Look at [guard.js](src/commands/guard.js) or [investigate.js](src/commands/investigate.js) as templates. The basic structure:

```js
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { characters } = require("../util/characterHelpers/characterUtil");
const { isAlive } = require("../util/rolesHelpers");
const { findGame, findUser, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.NEW_COMMAND)
    .setDescription("NEW_CHARACTER: Short description of what this does.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Player to target")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const dbUser = await findUser(interaction.user.id, interaction.guild.id);
    const game = await findGame(interaction.guild.id);

    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) ||
        dbUser.character !== characters.NEW_CHARACTER ||
        game.is_day,  // remove if usable during the day
    });

    if (deniedMessage) {
      await interaction.editReply({ content: deniedMessage });
      return;
    }

    const target = interaction.options.getUser("target");
    const targetDbUser = await findUser(target.id, interaction.guild.id);

    if (!targetDbUser || targetDbUser.is_dead) {
      await interaction.editReply({ content: "You must target an alive player." });
      return;
    }

    await updateUser(dbUser.user_id, interaction.guild.id, {
      new_character_target_id: target.id,
    });

    await interaction.editReply({ content: `You have targeted ${target}.` });
  },
};
```

---

## 5. Register the Command Name

**File:** [src/util/commandHelpers.js](src/util/commandHelpers.js)

Add to the `commandNames` object:

```js
const commandNames = {
  // ... existing ...
  NEW_COMMAND: "new_command",
};
```

---

## 6. Add the Welcome DM

**File:** [src/util/commandHelpers.js](src/util/commandHelpers.js)

In the `sendGreeting()` function, add a `case` for your character. This DM is sent to every player when the game starts:

```js
case characters.NEW_CHARACTER:
  await member.send(
    `You are a **New Character**!\n` +
    `Your goal is...\n` +
    `Each night, use \`/new_command\` in the #new-character channel to...\n` +
    `${voteText}`
  );
  break;
```

---

## 7. Add a Channel (if needed)

Skip this section if the character operates in an existing channel (e.g., town square) or via DM only.

**File:** [src/util/channelHelpers.js](src/util/channelHelpers.js)

### a. Register the channel name

```js
const channelNames = {
  // ... existing ...
  NEW_CHARACTER: "new-character",
};
```

### b. Add it to `organizeChannels()`

```js
case channelNames.NEW_CHARACTER:
  channelObject.newCharacter = channel;
  break;
```

### c. Add it to `giveChannelPermissions()` — called when a player gets their role

```js
case characters.NEW_CHARACTER:
  channel = organizedChannels.newCharacter;
  break;
```

### d. Add it to `createChannels()` — creates the channel at game start

```js
{
  channelName: channelNames.NEW_CHARACTER,
  characterNames: [characters.NEW_CHARACTER],
},
```

### e. Add it to `removeAllGameChannels()` — deletes channel at game end

```js
case channelNames.NEW_CHARACTER:
  await channel.delete();
  break;
```

### f. Add a start message

At the bottom of [channelHelpers.js](src/util/channelHelpers.js) with the other `const ...Start` strings:

```js
const newCharacterStart = `Welcome to your private channel, New Character! Your mission is...`;
```

Then send it in `sendStartMessages()`:

```js
await organizedChannels?.newCharacter?.send(newCharacterStart);
```

---

## 8. Add the First-Night Message

**File:** [src/util/timeHelper.js](src/util/timeHelper.js)

In `nightTimeJob()`, inside the `if (game.first_night)` block, add a message to your channel:

```js
await organizedChannels?.newCharacter?.send(
  "This is the first night. Choose someone to target with the `/new_command` command."
);
```

---

## 9. Hook the Power into the Night Phase

**File:** [src/util/timeHelper.js](src/util/timeHelper.js)

Import your helper at the top of the file:

```js
const { executeNewCharacterPower } = require("./characterHelpers/newCharacterHelper");
```

Then call it inside `dayTimeJob()` at the appropriate point in the execution order. The existing order is:

1. `guardPlayers` — Bodyguard acts
2. `getKillTargetedUsers` / `killPlayers` — Werewolves kill
3. `vampiresAttack` — Vampires bite
4. `cursePlayers` — Witch curses
5. `returnMutedPlayers` — Mute wears off
6. `investigatePlayers` — Seer investigates
7. `givePower` — Monarch bestows power
8. `mutePlayers` — Granny mutes

Insert your call at the right position:

```js
await executeNewCharacterPower(interaction);
```

---

## 10. Update Player-Facing Docs

### Role description

**File:** [src/util/botMessages/player-roles.js](src/util/botMessages/player-roles.js)

Add an entry to the `roles` array:

```js
{
  label: "New Character",
  tag: characters.NEW_CHARACTER,
  emoji: "🆕",
  team: "villager",   // "werewolf", "vampire", or "solo"
  description: `### New Character
* Brief description of what this character does.
* Channel: new-character
* Commands: \`/new_command\``
},
```

Also add it to `selectCharacterList` if players should be able to select it in the character picker UI.

### Command description

**File:** [src/util/botMessages/commandsDescriptions.js](src/util/botMessages/commandsDescriptions.js)

Add an entry to the `commandList` array:

```js
{
  label: '/new_command (target)',
  role: 'new character',
  emoji: '🆕',
  description: `### /new_command (target)
This is the New Character command. Use it in the new-character channel at night. Select a target to apply your power. The result will appear the next morning.`
},
```

---

## Quick Reference Checklist

| Step | File | What to add |
|------|------|-------------|
| 1 | `characterUtil.js` | `characters.NEW_CHARACTER`, `characterInfoMap` entry, optionally `defaultCharacters` |
| 2 | `userHelpers.js` | `case` in `crateUserData()` for any extra DB fields |
| 3 | `newCharacterHelper.js` *(new)* | Night power logic |
| 4 | `newCommand.js` *(new)* | Slash command handler |
| 5 | `commandHelpers.js` | `commandNames.NEW_COMMAND` |
| 6 | `commandHelpers.js` | `sendGreeting()` case with welcome DM |
| 7 | `channelHelpers.js` | Channel name, organize, permissions, create, delete, start message *(if channel needed)* |
| 8 | `timeHelper.js` | First-night message *(if channel needed)* |
| 9 | `timeHelper.js` | Import helper, call `executeNewCharacterPower()` in `dayTimeJob()` |
| 10 | `player-roles.js` | Role description entry |
| 10 | `commandsDescriptions.js` | Command description entry |
