# Adding a New Power Up

This guide walks through every file you need to touch to add a new power up to the game. Power ups are optional abilities that players can receive at game start (via random distribution) or during the game (via the Monarch's `/bestow_power` command).

---

## How Power Ups Work

When a game starts, each player may receive one or more power ups stored as a plain object on their user document:

```js
power_ups: { gun: 1, shield: 2 }
```

The value is the number of remaining uses. `0` or `false` means depleted. Each slash command checks `dbUser.power_ups[PowerUpNames.YOUR_POWER]` to gate access, then calls `usePowerUp()` to decrement the count after use.

Power ups are either **active** (player triggers a command) or **passive** (checked automatically during game events like death).

---

## 1. Register the Power Up Name

**File:** [src/util/powerUpHelpers.js](src/util/powerUpHelpers.js)

Add to the `PowerUpNames` object:

```js
const PowerUpNames = {
  // ... existing ...
  NEW_POWER: "new_power",
};
```

Then add it to the weighted distribution maps. Higher weight = more likely to be randomly assigned. Range is 1–4.

```js
const PowersWithWeightsVillagers = {
  // ... existing ...
  [PowerUpNames.NEW_POWER]: 2,
};

const PowersWithWeightsWerewolves = {
  // ... existing ...
  [PowerUpNames.NEW_POWER]: 2,
};
```

Omit a power from one of the maps if it shouldn't be randomly given to that team. For example, a power that only makes sense for werewolves should not be in `PowersWithWeightsVillagers`.

---

## 2. Add the UI Description

**File:** [src/util/botMessages/powerUpMessages.js](src/util/botMessages/powerUpMessages.js)

Add an entry to `powerUpList`. This populates the admin power-selection UI during server setup.

```js
powerUpList = [
  // ... existing ...
  {
    label: "New Power",
    tag: PowerUpNames.NEW_POWER,
    emoji: "🎯",
    shortDescription: "/new_power",   // command to activate it, or "Automatically applies" if passive
    description: `Description of what this power does and when it activates.`
  },
]
```

---

## 3. Add the Greeting Message

**File:** [src/util/commandHelpers.js](src/util/commandHelpers.js)

Add to the `powerUpMessages` Map. This message is DM'd to the player when the game starts and they have this power.

```js
const powerUpMessages = new Map([
  // ... existing ...
  [PowerUpNames.NEW_POWER, "You have the **New Power**! Use `/new_power` to..."],
]);
```

---

## 4. Register the Command Name

**File:** [src/util/commandHelpers.js](src/util/commandHelpers.js)

Skip this step only if the power is entirely passive (like the Shield, which activates automatically on death).

Add to the `commandNames` object:

```js
const commandNames = {
  // ... existing ...
  NEW_POWER: "new_power",
};
```

---

## 5. Create the Slash Command

**File:** `src/commands/newPower.js` *(new file)*

Use [stun.js](src/commands/stun.js) or [allianceDetector.js](src/commands/allianceDetector.js) as a template. The standard pattern:

```js
const { SlashCommandBuilder } = require("@discordjs/builders");
const { commandNames } = require("../util/commandHelpers");
const { PowerUpNames, usePowerUp } = require("../util/powerUpHelpers");
const { isAlive } = require("../util/rolesHelpers");
const { findUser, updateUser } = require("../werewolf_db");
const { permissionCheck } = require("../util/permissionCheck");
const { organizeChannels } = require("../util/channelHelpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandNames.NEW_POWER)
    .setDescription("Power up: Description of what this does.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Player to target")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;
    const dbUser = await findUser(interaction.user.id, guildId);

    // Gate: must be alive and must have this power
    const deniedMessage = await permissionCheck({
      interaction,
      dbUser,
      guildOnly: true,
      check: () =>
        !isAlive(interaction.member) ||
        !dbUser?.power_ups[PowerUpNames.NEW_POWER],
    });

    if (deniedMessage) {
      await interaction.editReply({ content: deniedMessage });
      return;
    }

    const targetUser = interaction.options.getUser("target");
    const targetMember = interaction.guild.members.cache.get(targetUser.id);
    const targetDbUser = await findUser(targetUser.id, guildId);

    // Validate target
    if (!isAlive(targetMember)) {
      await interaction.editReply({ content: "You must target an alive player." });
      return;
    }

    if (targetUser.id === interaction.user.id) {
      await interaction.editReply({ content: "You cannot target yourself." });
      return;
    }

    // Apply effect
    await updateUser(targetDbUser.user_id, guildId, {
      // ... your effect fields ...
    });

    // Consume the power
    await usePowerUp(dbUser, interaction, PowerUpNames.NEW_POWER);

    // Notify player (always ephemeral)
    await interaction.editReply({ content: `You used your New Power on ${targetUser}.` });

    // Announce in afterlife so dead players/observers can see
    const channels = interaction.guild.channels.cache;
    const organizedChannels = organizeChannels(channels);
    await organizedChannels.afterLife?.send(
      `${interaction.user} used the **New Power** on ${targetUser}.`
    );
  },
};
```

**Common validation checks to add as needed:**

```js
// Prevent use on first night
const game = await findGame(guildId);
if (game.first_night) {
  await interaction.editReply({ content: "You cannot use this on the first night." });
  return;
}

// Prevent use if player is muted
if (dbUser.is_muted) {
  await interaction.editReply({ content: "You are muted and cannot use powers." });
  return;
}

// Prevent use at night (day-only power)
if (!game.is_day) {
  await interaction.editReply({ content: "You can only use this during the day." });
  return;
}

// Prevent use during the day (night-only power)
if (game.is_day) {
  await interaction.editReply({ content: "You can only use this at night." });
  return;
}
```

---

## 6. Add the Command Description

**File:** [src/util/botMessages/commandsDescriptions.js](src/util/botMessages/commandsDescriptions.js)

Add an entry to the `commandList` array so players can read about it in the `/info` help UI:

```js
{
  label: '/new_power (target)',
  role: 'power up',
  emoji: '🎯',
  description: `### /new_power (target)
This command is available to any player who has the New Power power up. Use it to... 
The power up is consumed after use.`
},
```

---

## 7. Passive Power Ups (no command needed)

If your power activates automatically — like the **Shield**, which intercepts death — integrate it into [src/util/deathHelper.js](src/util/deathHelper.js) rather than creating a command.

In `removesDeadPermissions()`, the shield check looks like this:

```js
if (dbUser.power_ups[PowerUpNames.SHIELD] && causeOfDeath !== WaysToDie.BROKEN_HEART) {
  await usePowerUp(dbUser, interaction, PowerUpNames.SHIELD);
  // send shield message...
  return "shield"; // returning a string stops the death from proceeding
}
```

Follow the same pattern for any power that should intercept or modify a game event.

---

## 8. Clearing State at Day/Night Transitions (if needed)

If your power sets a flag on a player (like `is_stunned`) that needs to be cleared at each cycle, add cleanup calls in [src/util/timeHelper.js](src/util/timeHelper.js).

The stun power clears at both transitions:

```js
// In dayTimeJob() — runs at dawn
await removeStunnedUsers(interaction);

// In nightTimeJob() — runs at dusk
await removeStunnedUsers(interaction);
```

If your power has a per-cycle effect, import your helper and call it in the appropriate job function. Powers that only need clearing once (e.g., "lasts through the night") go only in `dayTimeJob()`.

---

## Quick Reference Checklist

| Step | File | What to add |
|------|------|-------------|
| 1 | `powerUpHelpers.js` | `PowerUpNames.NEW_POWER`, weight in both villager/werewolf maps |
| 2 | `botMessages/powerUpMessages.js` | Entry in `powerUpList` (label, tag, emoji, description) |
| 3 | `commandHelpers.js` | Entry in `powerUpMessages` Map (DM greeting text) |
| 4 | `commandHelpers.js` | `commandNames.NEW_POWER` *(skip if passive)* |
| 5 | `commands/newPower.js` *(new)* | Slash command with permission check + `usePowerUp()` *(skip if passive)* |
| 6 | `botMessages/commandsDescriptions.js` | Entry in `commandList` *(skip if passive)* |
| 7 | `deathHelper.js` | Passive intercept logic *(only if passive)* |
| 8 | `timeHelper.js` | State cleanup at day/night transition *(only if power sets a flag)* |

### Things you get for free

- **Steal compatibility** — `steal.js` reads `power_ups` dynamically, so your new power is automatically steal-able.
- **Monarch grants** — `givePower.js` builds its choice list from `PowerUpNames`, so the Monarch can bestow it without any changes.
- **Admin toggle** — `selectPowerUps.js` reads `PowerUpNames` to populate the admin UI, so admins can enable/disable it automatically.
- **`/who_am_i` display** — Shows all `power_ups` keys and counts from the user document automatically.
