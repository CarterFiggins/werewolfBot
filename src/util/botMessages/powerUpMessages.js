const { PowerUpNames } = require("../powerUpHelpers")

powerUpList = [
  {
    label: "Select All",
    tag: "select-all",
    emoji: "⚡",
    shortDescription: "Enable all powers",
    description: '',
  },
  {
    label: "Gun",
    tag: PowerUpNames.GUN,
    emoji: "🔫",
    shortDescription: "/shoot",
    description: `Getting this power up will give you the ability to use the shoot command once.`
  },
  {
    label: "Predator Vision",
    tag: PowerUpNames.PREDATOR_VISION,
    emoji: "👀",
    shortDescription: "/predator_vision",
    description: `Using this power will tell you the true role of the player.`
  },
  {
    label: "Shield",
    tag: PowerUpNames.SHIELD,
    emoji: "🛡️",
    shortDescription: "Automatically applies",
    description: `Will protect you from death once. The shield will not protect from a vampire bite.`
  },
  {
    label: "Alliance Detector",
    tag: PowerUpNames.ALLIANCE_DETECTOR,
    emoji: "🕵️",
    shortDescription: "/alliance_detector",
    description: `Using this power will tell you if two players are on the same team.`
  },
  {
    label: "Stun",
    tag: PowerUpNames.STUN,
    emoji: "👊",
    shortDescription: "/stun",
    description: `Use this power to stun a player. Stunning a player will stop them from voting if used in the day. If used at night it will stop them from using a power at night.`,
  },
  {
    label: "Steal",
    tag: PowerUpNames.STEAL,
    emoji: "🥷",
    shortDescription: "/steal",
    description: `Steal a random power from a player. If they have no power then you get nothing. Can't steal the steal power from another player.`,
  },
  {
    label: "Smoke Bomb",
    tag: PowerUpNames.SMOKE_BOMB,
    emoji: "💨",
    shortDescription: "/smoke_bomb",
    description: `Activate at night to disappear until morning, or set it up during the day so it goes off when night falls. No character power will work on you that night (werewolf and serial killer attacks, vampire bites, seer investigations, bodyguard guards, witch curses, granny mutes, monarch gifts) and gun shots will miss. Other power ups still work on you.`,
  },
]

module.exports = {
  powerUpSelectionIntro: `## Power Up Selection\nSelect Power Ups and the amount for the next game`,
  powerUpList,
}