const _ = require("lodash");
const { characters, characterPoints } = require("./commandHelpers");

const randomWolfHelperCard = () => {
  return _.head(
    _.shuffle([
      characters.WEREWOLF,
      characters.CUB,
      characters.FOOL,
      characters.CURSED,
      characters.LYCAN,
    ])
  );
};

const randomVillagerHelperCard = () => {
  return _.head(
    _.shuffle([
      characters.SEER,
      characters.MASON,
      characters.APPRENTICE_SEER,
      characters.HUNTER,
      characters.VILLAGER,
    ])
  );
};

function computeCharacters(numberOfPlayers) {
  // subtracting the werewolfCubs and first werewolf
  const maxWerewolves =
    Math.floor(numberOfPlayers / 4) - Math.floor(numberOfPlayers / 12) - 1;
  const maxWerewolfCub = Math.floor(numberOfPlayers / 12);
  const maxMasons = Math.floor(numberOfPlayers / 8) + 1;
  const maxSeers = Math.floor(numberOfPlayers / 25) + 1;
  const maxFools = Math.floor(numberOfPlayers / 20) + 1;
  const maxLycans = Math.floor(numberOfPlayers / 10) + 1;
  const maxApprenticeSeers = Math.floor(numberOfPlayers / 25) + 1;
  const maxHunters = Math.floor(numberOfPlayers / 10) + 1;
  const maxCursedVillager = Math.floor(numberOfPlayers / 15) + 1;
  const maxVillager = Math.floor(numberOfPlayers / 5);
  // only one bodyguard for now
  const maxBodyguards = 1;
  // only one baker for now
  const maxBakers = 1;

  const werewolfHelperCards = _.shuffle([
    ...Array(maxWerewolves).fill(characters.WEREWOLF),
    ...Array(maxWerewolfCub).fill(characters.CUB),
    ...Array(maxLycans).fill(characters.LYCAN),
    ...Array(maxFools).fill(characters.FOOL),
    ...Array(maxCursedVillager).fill(characters.CURSED),
    ...Array(maxBakers).fill(characters.BAKER),
  ]);

  const villagerHelperCards = _.shuffle([
    ...Array(maxSeers).fill(characters.SEER),
    ...Array(maxMasons).fill(characters.MASON),
    ...Array(maxApprenticeSeers).fill(characters.APPRENTICE_SEER),
    ...Array(maxHunters).fill(characters.HUNTER),
    ...Array(maxBodyguards).fill(characters.BODYGUARD),
    ...Array(maxVillager).fill(characters.VILLAGER),
  ]);

  const currentCharacters = [characters.WEREWOLF];
  let werewolfPoints = characterPoints.get(characters.WEREWOLF);
  let villagerPoints = 0;

  _.forEach(_.range(numberOfPlayers - 1), () => {
    if (werewolfPoints < villagerPoints) {
      let newCharacter = !_.isEmpty(werewolfHelperCards)
        ? werewolfHelperCards.pop()
        : randomWolfHelperCard();
      werewolfPoints += characterPoints.get(newCharacter);
      currentCharacters.push(newCharacter);
    } else {
      let newCharacter = !_.isEmpty(villagerHelperCards)
        ? villagerHelperCards.pop()
        : randomVillagerHelperCard();
      villagerPoints += characterPoints.get(newCharacter);
      currentCharacters.push(newCharacter);
    }
  });

  return currentCharacters;
}

module.exports = computeCharacters;
