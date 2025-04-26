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
    label: "SHIELD",
    tag: PowerUpNames.SHIELD,
    emoji: "🛡️",
    shortDescription: "Automatically applies",
    description: `Will protect you from death once. The shield will not protect from a vampire bite.`
  },
  {
    label: "Alliance Detector",
    tag: PowerUpNames.ALLIANCE_DETECTOR,
    emoji: "🛡️",
    shortDescription: "/alliance_detector",
    description: `Using this power will tell you if two players are on the same team.`
  },
]

module.exports = {
  powerUpSelectionIntro: `## Power Up Selection\nSelect Power ups and the amount for the next game`,
  powerUpList,
}