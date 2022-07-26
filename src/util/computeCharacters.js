const _ = require("lodash");
const { findSettings } = require("../werewolf_db");
const { characters } = require("./commandHelpers");

const characterPoints = new Map([
  [characters.VILLAGER, 3],
  [characters.SEER, 6],
  [characters.BODYGUARD, 6],
  [characters.APPRENTICE_SEER, 7],
  [characters.MASON, 4],
  [characters.HUNTER, 4],
  [characters.WEREWOLF, 6],
  [characters.FOOL, 2],
  [characters.LYCAN, 3],
  [characters.BAKER, 6],
  [characters.CURSED, 4],
  [characters.CUB, 7],
  [characters.WITCH, 7],
  [characters.VAMPIRE, 50],
  [characters.DOPPELGANGER, 10],
]);

async function computeCharacters(numberOfPlayers, guildId) {
  const settings = await findSettings(guildId);

  // subtracting the werewolfCubs and first werewolf
  const allowVampiresAt = 15;
  const divideWerewolvesBy = numberOfPlayers >= allowVampiresAt ? 5 : 4;
  const divideCubBy = numberOfPlayers >= allowVampiresAt ? allowVampiresAt : 12;

  const oneEvery = (divNum) => Math.floor(numberOfPlayers / divNum);

  const maxVampires =
    oneEvery(25) + (numberOfPlayers >= allowVampiresAt ? 1 : 0);
  const maxWitches = oneEvery(28) + (numberOfPlayers >= 14 ? 1 : 0);
  const maxWerewolves = oneEvery(divideWerewolvesBy) - oneEvery(divideCubBy);

  let werewolfHelperCards = [
    ...Array(oneEvery(10) + 1).fill(characters.LYCAN),
    characters.BAKER,
  ];

  let villagerHelperCards = [
    ...Array(oneEvery(25)).fill(characters.SEER),
    ...Array(oneEvery(20)).fill(characters.BODYGUARD),
    ...Array(oneEvery(8)).fill(characters.MASON),
    ...Array(oneEvery(10) + 1).fill(characters.HUNTER),
    ...Array(oneEvery(10) + 1).fill(characters.VILLAGER),
  ];

  const vampireHelperCards = _.shuffle(
    settings.allow_vampires
      ? [...Array(maxVampires).fill(characters.VAMPIRE)]
      : []
  );

  // EXTRA CARDS
  if (settings.extra_characters) {
    werewolfHelperCards.concat([
      ...Array(oneEvery(18) + 1).fill(characters.CURSED),
      ...Array(maxWitches).fill(characters.WITCH),
      ...Array(oneEvery(20) + 1).fill(characters.FOOL),
    ]);
    villagerHelperCards.concat([
      ...Array(oneEvery(10)).fill(characters.DOPPELGANGER),
      ...Array(oneEvery(25) + 1).fill(characters.APPRENTICE_SEER),
    ]);
  }

  werewolfHelperCards = _.shuffle(werewolfHelperCards);
  villagerHelperCards = _.shuffle(villagerHelperCards);

  // characters that are always in the game
  const forceGoodCharacters = [characters.SEER, characters.BODYGUARD];

  let werewolfPoints = 0;
  const currentCharacters = [
    ..._.map(_.range(maxWerewolves), () => {
      werewolfPoints += characterPoints.get(characters.WEREWOLF);
      return characters.WEREWOLF;
    }),
    ..._.map(_.range(oneEvery(divideCubBy)), () => {
      werewolfPoints += characterPoints.get(characters.CUB);
      return characters.CUB;
    }),
    ...forceGoodCharacters,
  ];

  let villagerPoints = _.sumBy(forceGoodCharacters, (character) =>
    characterPoints.get(character)
  );
  let vampirePoints = 20;
  // minus off players already added
  const playersLeftOver = numberOfPlayers - currentCharacters.length;

  // if we don't have enough cards for players make more
  let totalCards =
    werewolfHelperCards.length +
    villagerHelperCards.length +
    vampireHelperCards.length;
  if (totalCards < playersLeftOver) {
    const cardsToMake = playersLeftOver - totalCards;
    _.forEach(_.range(cardsToMake), (num) => {
      if (num % 4 === 0) {
        werewolfHelperCards.push(characters.LYCAN);
      } else {
        villagerHelperCards.push(characters.VILLAGER);
      }
    });
  }

  // so we can add two masons
  let skipLoop = false;
  let masonInGame = false;

  const getNextCharacter = (cards) =>
    _.isEmpty(cards) ? characters.DOPPELGANGER : cards.pop();

  _.forEach(_.range(playersLeftOver), (count) => {
    if (!skipLoop) {
      const applyWerewolfHelperCard =
        werewolfPoints <= villagerPoints &&
        (werewolfPoints <= vampirePoints || !settings.allow_vampires);

      const applyVampireHelperCard =
        vampirePoints <= werewolfPoints &&
        vampirePoints <= villagerPoints &&
        settings.allow_vampires;

      if (applyWerewolfHelperCard) {
        let newCharacter = getNextCharacter(werewolfHelperCards);
        werewolfPoints += characterPoints.get(newCharacter);
        currentCharacters.push(newCharacter);
      } else if (applyVampireHelperCard) {
        let newCharacter = getNextCharacter(vampireHelperCards);
        currentCharacters.push(newCharacter);
        vampirePoints += characterPoints.get(newCharacter);
      } else {
        // *** applyVillagerHelperCard  ***
        let newCharacter = getNextCharacter(villagerHelperCards);
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

  // SUPER SHUFFLE :)
  const numberOfShuffles = Math.floor(Math.random() * 5) + 1;
  let shuffledCharacters = currentCharacters;
  _.forEach(_.range(numberOfShuffles), () => {
    shuffledCharacters = _.shuffle(shuffledCharacters);
  });

  return shuffledCharacters;
}

module.exports = computeCharacters;
