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
    Math.floor(numberOfPlayers / 4) - Math.floor(numberOfPlayers / 16) - 1;
  const maxWerewolfCub = Math.floor(numberOfPlayers / 16);
  const maxMasons = Math.floor(numberOfPlayers / 8);
  const maxSeers = Math.floor(numberOfPlayers / 25);
  const maxFools = Math.floor(numberOfPlayers / 20) + 1;
  const maxLycans = Math.floor(numberOfPlayers / 10) + 1;
  const maxApprenticeSeers = Math.floor(numberOfPlayers / 25) + 1;
  const maxHunters = Math.floor(numberOfPlayers / 10) + 1;
  const maxCursedVillager = Math.floor(numberOfPlayers / 15) + 1;
  // only one witch for now
  const maxWitches = numberOfPlayers >= 14 ? 1 : 0;
  // only one bodyguard for now
  const maxBodyguards = 1;
  // only one baker for now
  const maxBakers = 1;
  let maxVillagers = 2;

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
    maxBodyguards +
    maxBakers +
    maxWitches;

  if (numberOfPlayers > totalCharacters) {
    maxVillagers += numberOfPlayers - totalCharacters;
  }

  const werewolfHelperCards = _.shuffle([
    ...Array(maxWerewolves).fill(characters.WEREWOLF),
    ...Array(maxWerewolfCub).fill(characters.CUB),
    ...Array(maxLycans).fill(characters.LYCAN),
    ...Array(maxFools).fill(characters.FOOL),
    ...Array(maxCursedVillager).fill(characters.CURSED),
    ...Array(maxBakers).fill(characters.BAKER),
    ...Array(maxWitches).fill(characters.WITCH),
  ]);

  const villagerHelperCards = _.shuffle([
    ...Array(maxSeers).fill(characters.SEER),
    ...Array(maxMasons).fill(characters.MASON),
    ...Array(maxApprenticeSeers).fill(characters.APPRENTICE_SEER),
    ...Array(maxHunters).fill(characters.HUNTER),
    ...Array(maxBodyguards).fill(characters.BODYGUARD),
    ...Array(maxVillagers).fill(characters.VILLAGER),
  ]);

  const currentCharacters = [characters.WEREWOLF, characters.SEER];
  let werewolfPoints = characterPoints.get(characters.WEREWOLF);
  let villagerPoints = characterPoints.get(characters.SEER);
  // minus off players already added
  const playersLeftOver = numberOfPlayers - currentCharacters.length;
  let masonInGame = false;
  let skipLoop = false;

  _.forEach(_.range(playersLeftOver), (count) => {
    if (!skipLoop) {
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

  return currentCharacters;
}

module.exports = computeCharacters;
