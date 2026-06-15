const SettingCommands = {
  KING_BITE_WOLF_SAFE: "king_bite_wolf_safe",
  KING_VICTIM_ATTACK_SAFE: "king_victim_attack_safe",
  ALLOW_FIRST_BITE: "allow_first_bite",
  WOLF_KILLS_WITCH: "wolf_kills_witch",
  ALLOW_LYCAN_GUARD: "allow_lycan_guard",
  BODYGUARD_JOINS_MASONS: "bodyguard_joins_masons",
  SEER_JOINS_MASONS: "seer_joins_masons",
  HUNTER_GUARD: "hunter_guard",
  ALLOW_REACTIONS: "allow_reactions",
  RANDOM_CARDS: "random_cards",
  CAN_WHISPER: "can_whisper",
  HARD_MODE: "hard_mode",
  ENABLE_POWER_UPS: "enable_power_ups",
  DOUBLE_HANGING: "double_hanging",
  ADMIN_CONTROLS_CARDS: "admin_controls_cards",
  WEREWOLF_CREATES_HENCHMAN: "werewolf_creates_henchman",
};

function formatTime(timeStr) {
  if (!timeStr) return "Not set";
  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteStr || "00"} ${period}`;
}

function b(value) {
  return value ? "👍" : "👎";
}

function buildSettingsView(settings) {
  return [
    `**BASIC SETTINGS:**`,
    `Admin(s) choose Roles (& amounts)?: ${b(settings.admin_controls_cards)}`,
    `All players start game with Powerup?: ${b(settings.enable_power_ups)}`,
    `Bot includes Roles randomly?: ${b(settings.random_cards)}`,
    `Day begins: ${formatTime(settings.day_time)}`,
    `Emoji reactions allowed?: ${b(settings.allow_reactions)}`,
    `Hard Mode?: ${b(settings.hard_mode)}`,
    `Night begins: ${formatTime(settings.night_time)}`,
    `Top 2 voted-for players get hanged?: ${b(settings.double_hanging)}`,
    `Whispering allowed?: ${b(settings.can_whisper)}`,
    ``,
    `**MISC. ROLES:**`,
    `Bodyguard is a Mason after guarding one?: ${b(settings.bodyguard_joins_masons)}`,
    `Lycan survives 1st Wolf attack?: ${b(settings.allow_lycan_guard)}`,
    `Seer is a Mason after investigating one?: ${b(settings.seer_joins_masons)}`,
    `Wolves kill Witch OR recruit Witch?: ${settings.wolf_kills_witch ? "💀" : "🐺"}`,
    ``,
    `**VAMPIRES:**`,
    `Vampire King lives when biting Wolf?: ${b(settings.king_bite_wolf_safe)}`,
    `Vampire King lives when biting Wolf target?: ${b(settings.king_victim_attack_safe)}`,
    `Vampire King turns 1st victim on 1st bite?: ${b(settings.allow_first_bite)}`,
    ``,
    `**WEREWOLVES:**`,
    `Random Wolf shot when Hunter dies?: ${b(settings.hunter_guard)}`,
    `Wolf victim on 1st night = Henchman?: ${b(settings.werewolf_creates_henchman)}`,
  ].join("\n");
}

module.exports = {
  SettingCommands,
  buildSettingsView,
  settingsIntro: `# Settings
  Admins can use the command \`/settings edit\` to turn settings off or on.
  `,
  settingsList: [
    {
      label: 'Night and Day times',
      emoji: '⌛',
      description: `# Night and Day times
Use these commands (\`/settings night_time\`, \`/settings day_time\`) to set the day and night time in the game. Currently the time zone is set in MST. So you might need to adjust the time if you are in a different time zone.
`
    },
    {
      id: SettingCommands.KING_BITE_WOLF_SAFE,
      label: 'King Vampire biting werewolf',
      emoji: '🧛‍♂️',
      description: `### King Vampire biting werewolf
If this setting is on it will protect the King Vampire if they try and bite a werewolf. They will get a message saying that the user is protected or can defend against their attacks.
This will only apply to the vampire king and the other vampires will die if they try to bite a werewolf.
`,
    },
    {
      id: SettingCommands.KING_VICTIM_ATTACK_SAFE,
      label: 'King Vampire biting prey',
      emoji: '🧛‍♂️',
      description: `### King Vampire biting prey
If this setting is on it will protect the King Vampire if they try and bite a player that is also attacked by a werewolf.
This will only apply to the vampire king and the other vampires will die if they try to bite a player that is also being attacked by the werewolves.
`,
    },
    {
      id: SettingCommands.ALLOW_FIRST_BITE,
      label: 'King Vampire first bite',
      emoji: '🧛‍♂️',
      description: `### King Vampire first Bite
If this setting is on the King Vampire first successful bite will convert a player into a vampire. After that it will take two bites to convert a player into a vampire.
`,
    },
    {
      id: SettingCommands.WOLF_KILLS_WITCH,
      label: 'Werewolf can kill Witch',
      emoji: '🐾',
      description: `### Werewolf can kill witch
If this setting is on the werewolf will kill the witch. If this setting is off the witch will not die and join the werewolf channel.
`,
    },
    {
      id: SettingCommands.ALLOW_LYCAN_GUARD,
      label: 'Lycan guard',
      emoji: '🛡️',
      description: `### Lycan guard
If this setting is on the lycan will be protected from one werewolf attack. After that they will die if the werewolf attacks them. The werewolves will be told if they tried to kill the lycan.
`,
    },
    {
      id: SettingCommands.BODYGUARD_JOINS_MASONS,
      label: 'Bodyguard joins Masons',
      emoji: '💂‍♂️',
      description: `### Bodyguard joins Masons
If this setting is on the bodyguard can join the masons channel if they guard one of them.
`,
    },
    {
      id: SettingCommands.SEER_JOINS_MASONS,
      label: 'Seer joins Masons',
      emoji: '🔮',
      description: `### Seer joins Masons
If this setting is on the seer can join the masons channel if they investigate one of them.
`,
    },
    {
      id: SettingCommands.HUNTER_GUARD,
      label: 'Hunter guard',
      emoji: '🔫',
      description: `### Hunter guard
If this setting is on the hunter will auto kill a random werewolf if they are attacked by one in the night. After that they will die without the ability to shoot their gun. If they die any other way they will be able to shoot their gun.
`,
    },
    {
      id: SettingCommands.ALLOW_REACTIONS,
      label: 'Discord Reactions',
      emoji: '😂',
      description: `### Discord Reactions
Because Discord lets people add to existing reactions when they can view the channel, there is a chance to cheat when dead. If this setting is off it will disable reactions so people will not be able to cheat.
`,
    },
    {
      id: SettingCommands.RANDOM_CARDS,
      label: 'Random Characters',
      emoji: '🎲',
      description: `### Random Characters
Turn this setting on to make each character random. The game will try its best to balance the teams. The only set characters are the werewolves and if you allow single characters like vampire and chaos demon. Turning this setting off will attempt to use all characters available and if it runs out will start using random characters. 
`,
    },
    {
      id: SettingCommands.CAN_WHISPER,
      label: 'Allow Whispers',
      emoji: '🔉',
      description: `### Allow Whispers
Turn this setting on to allow the whisper command to be used. Users will only be able to whisper once per day and it will reset after the day cycle ends.
`,
    },
    {
      id: SettingCommands.HARD_MODE,
      label: 'Hard Mode',
      emoji: '🥲',
      description: `### Hard Mode
Turn this setting on to hide the werewolf and vampire count in the who_is_alive command. This will also hide the players character when they are hanged. When a player dies in a different way it will show their character. e.g. when the werewolves kill a player. 
`,
    },
    {
      id: SettingCommands.ENABLE_POWER_UPS,
      label: 'Power Ups',
      emoji: '🦸‍♂️',
      description: `### Power Ups
Turn this on to give a power to each player at the start of the game. The powers are the same that the monarch can give. Players are given powers randomly.
`,
    },
    {
      id: SettingCommands.DOUBLE_HANGING,
      label: 'Double Hanging',
      emoji: '2️⃣',
      description: `### Double Hanging
This setting will hang two people instead of one. It will take the top two voted players and if there is a three way tie it will randomly kill two of them. If there is one with higher votes then the others they will die and the rest that tied second will be picked at random.
`,
    },
    {
      id: SettingCommands.ADMIN_CONTROLS_CARDS,
      label: 'Admin Controls Cards',
      emoji: '🧑‍⚖️',
      description: `### Admin Controls Cards
Lets Admins select each card amount in the game. (If there are less cards than people then the remaining players will become Doppelgangers)
`,
    },
    {
      id: SettingCommands.WEREWOLF_CREATES_HENCHMAN,
      label: 'Werewolf Creates Henchman',
      emoji: '👻',
      description: `### Werewolf Creates Henchman
On the first night the werewolves will not kill a player and will convert them into a henchman. Henchman will be on the werewolf's team. They will not be counted for the werewolf or villager win condition. Some players will die instead of becoming the henchman. e.g. Chaos demon and vampire king. Vampires will not be able to bite the henchman.
`,
    },
  ],
}