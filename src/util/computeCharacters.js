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
  const divideWerewolvesBy = numberOfPlayers >= 16 ? 5 : 4;
  const divideCubBy = numberOfPlayers >= 16 ? 16 : 14;

  const maxWerewolves =
    Math.floor(numberOfPlayers / divideWerewolvesBy) -
    Math.floor(numberOfPlayers / divideCubBy);
  const maxWerewolfCub = Math.floor(numberOfPlayers / divideCubBy);
  // first mason will be two masons
  const maxMasons = Math.floor(numberOfPlayers / 8);
  const maxSeers = Math.floor(numberOfPlayers / 25);
  const maxFools = Math.floor(numberOfPlayers / 20) + 1;
  const maxLycans = Math.floor(numberOfPlayers / 10) + 1;
  const maxApprenticeSeers = Math.floor(numberOfPlayers / 25) + 1;
  const maxHunters = Math.floor(numberOfPlayers / 10) + 1;
  const maxCursedVillager = Math.floor(numberOfPlayers / 15) + 1;
  const maxVampires = Math.floor(numberOfPlayers / 16);
  let maxVillagers = Math.floor(numberOfPlayers / 10) + 1;
  // only one witch for now
  const maxWitches = numberOfPlayers >= 14 ? 1 : 0;
  // Add max bodyguards when there can be more than one bodyguard
  // only one baker for now
  const maxBakers = 1;

  const totalCharacters =
    maxWerewolfCub +
    maxMasons +
    maxSeers +
    maxFools +
    maxLycans +
    maxApprenticeSeers +
    maxHunters +
    maxCursedVillager +
    maxVillagers +
    maxBakers +
    maxVampires +
    maxWitches;

  if (numberOfPlayers > totalCharacters) {
    maxVillagers += numberOfPlayers - totalCharacters;
  }

  const werewolfHelperCards = _.shuffle([
    ...Array(maxLycans).fill(characters.LYCAN),
    ...Array(maxCursedVillager).fill(characters.CURSED),
    ...Array(maxBakers).fill(characters.BAKER),
    ...Array(maxWitches).fill(characters.WITCH),
  ]);

  const villagerHelperCards = _.shuffle([
    ...Array(maxSeers).fill(characters.SEER),
    ...Array(maxApprenticeSeers).fill(characters.APPRENTICE_SEER),
    ...Array(maxFools).fill(characters.FOOL),
    ...Array(maxMasons).fill(characters.MASON),
    ...Array(maxHunters).fill(characters.HUNTER),
    ...Array(maxVillagers).fill(characters.VILLAGER),
  ]);

  // only one card for now
  const vampireHelperCards = _.shuffle([
    ...Array(maxVampires).fill(characters.VAMPIRE),
  ]);

  let werewolfPoints = 0;
  const currentCharacters = [
    ..._.map(_.range(maxWerewolves), () => {
      werewolfPoints += characterPoints.get(characters.WEREWOLF);
      return characters.WEREWOLF;
    }),
    ..._.map(_.range(maxWerewolfCub), () => {
      werewolfPoints += characterPoints.get(characters.CUB);
      return characters.CUB;
    }),
    characters.SEER,
    characters.BODYGUARD,
  ];
  let villagerPoints =
    characterPoints.get(characters.SEER) +
    characterPoints.get(characters.BODYGUARD);
  let vampirePoints = 25;
  // minus off players already added
  const playersLeftOver = numberOfPlayers - currentCharacters.length;
  let masonInGame = false;
  let skipLoop = false;

  _.forEach(_.range(playersLeftOver), (count) => {
    if (!skipLoop) {
      if (werewolfPoints < villagerPoints && werewolfPoints < vampirePoints) {
        let newCharacter = !_.isEmpty(werewolfHelperCards)
          ? werewolfHelperCards.pop()
          : randomWolfHelperCard();
        werewolfPoints += characterPoints.get(newCharacter);
        currentCharacters.push(newCharacter);
      } else if (
        vampirePoints < werewolfPoints &&
        vampirePoints < villagerPoints
      ) {
        let newCharacter = !_.isEmpty(vampireHelperCards)
          ? vampireHelperCards.pop()
          : _.head(
              _.shuffle([randomWolfHelperCard(), randomVillagerHelperCard()])
            );
        currentCharacters.push(newCharacter);
        // When we add more vampire helper cards we will use characterPoints
        vampirePoints += 40;
      } else {
        let newCharacter = !_.isEmpty(villagerHelperCards)
          ? villagerHelperCards.pop()
          : randomVillagerHelperCard();

        if (newCharacter === characters.MASON && !masonInGame) {
          // Last player don't add masons
          if (count === playersLeftOver - 1) {
            newCharacter = characters.VILLAGER;
            villagerPoints += characterPoints.get(newCharacter);
            currentCharacters.push(newCharacter);
          } else {
            // add two masons
            villagerPoints += characterPoints.get(newCharacter) * 2;
            currentCharacters.push(newCharacter);
            currentCharacters.push(newCharacter);
            masonInGame = true;
            skipLoop = true;
          }
        } else {
          villagerPoints += characterPoints.get(newCharacter);
          currentCharacters.push(newCharacter);
        }
      }
    } else {
      skipLoop = false;
    }
  });

  const numberOfShuffles = Math.floor(Math.random() * 5) + 1;

  let shuffledCharacters = currentCharacters;

  _.forEach(_.range(numberOfShuffles), () => {
    shuffledCharacters = _.shuffle(shuffledCharacters);
  });

  return shuffledCharacters;
}

module.exports = computeCharacters;
