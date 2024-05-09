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
  [characters.WEREWOLF, 7],
  [characters.FOOL, 3],
  [characters.LYCAN, 4],
  [characters.BAKER, 6],
  [characters.MUTATED, 4],
  [characters.CUB, 8],
  [characters.WITCH, 7],
  [characters.VAMPIRE, 50],
  [characters.DOPPELGANGER, 5],
  [characters.GROUCHY_GRANNY, 4]
]);

async function computeCharacters(numberOfPlayers, guildId) {
  const settings = await findSettings(guildId);

  const oneEvery = (divNum) => Math.floor(numberOfPlayers / divNum);

  const allowVampiresAt = 16;
  const maxVampires =
    oneEvery(30) + (numberOfPlayers >= allowVampiresAt ? 1 : 0);

  const divideWerewolvesBy = maxVampires >= 1 ? 7 : 6;
  const divideCubBy = 15;
  const maxWitches = oneEvery(28) + (numberOfPlayers >= 14 ? 1 : 0);
  const maxWerewolves = oneEvery(divideWerewolvesBy) - oneEvery(divideCubBy);

  let wolfCards = [
    characters.LYCAN,
    characters.BAKER,
    characters.WEREWOLF,
    characters.CUB,
  ]

  let villagerCards = [
    characters.SEER,
    characters.BODYGUARD,
    characters.MASON,
    characters.HUNTER,
    characters.VILLAGER,
  ]

  let werewolfHelperCards = [
    ...Array(oneEvery(10)).fill(characters.LYCAN),
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
    wolfCards.push(characters.MUTATED)
    wolfCards.push(characters.WITCH)
    wolfCards.push(characters.FOOL)
    villagerCards.push(characters.DOPPELGANGER)
    villagerCards.push(characters.APPRENTICE_SEER)
    villagerCards.push(characters.GROUCHY_GRANNY)
    werewolfHelperCards = werewolfHelperCards.concat([
      ...Array(oneEvery(9)).fill(characters.MUTATED),
      ...Array(maxWitches).fill(characters.WITCH),
      ...Array(oneEvery(12)).fill(characters.FOOL),
    ]);
    villagerHelperCards = villagerHelperCards.concat([
      ...Array(oneEvery(10)).fill(characters.DOPPELGANGER),
      ...Array(oneEvery(25) + 1).fill(characters.APPRENTICE_SEER),
      ...Array(oneEvery(20) + 1).fill(characters.GROUCHY_GRANNY),
    ]);
  }

  werewolfHelperCards = _.shuffle(werewolfHelperCards);
  villagerHelperCards = _.shuffle(villagerHelperCards);

  // characters that are always in the game
  const forceGoodCharacters = [characters.SEER, characters.BODYGUARD];

  let werewolfPoints = 0;
  const currentCharacters = settings.random_cards ? [
    ..._.map(_.range(1), () => {
    werewolfPoints += characterPoints.get(characters.WEREWOLF);
    return characters.WEREWOLF;
    }),
  ] : [
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

  let villagerPoints = 0
  if (!settings.random_cards) {
    villagerPoints = _.sumBy(forceGoodCharacters, (character) =>
      characterPoints.get(character)
    );
  }
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
      villagerHelperCards.push(characters.VILLAGER);
    });
  }

  // so we can add two masons
  let skipLoop = false;
  let masonInGame = false;

  const getNextCharacter = (cards) =>
    _.isEmpty(cards) ? characters.VILLAGER : cards.pop();
  
  const GetWerewolfHelperCard = () => {
    if (settings.random_cards) {
      return _.sample(wolfCards);
    }
    return _.isEmpty(werewolfHelperCards) ? characters.VILLAGER : werewolfHelperCards.pop();
  }
  const GetVillagerHelperCard = () => {
    if (settings.random_cards) {
      return _.sample(villagerCards);
    }
    return _.isEmpty(villagerHelperCards) ? characters.VILLAGER : villagerHelperCards.pop();
  }

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
        let newCharacter = GetWerewolfHelperCard();
        werewolfPoints += characterPoints.get(newCharacter);
        currentCharacters.push(newCharacter);
      } else if (applyVampireHelperCard) {
        let newCharacter = getNextCharacter(vampireHelperCards);
        currentCharacters.push(newCharacter);
        vampirePoints += characterPoints.get(newCharacter);
      } else {
        // *** applyVillagerHelperCard  ***
        let newCharacter = GetVillagerHelperCard();
        if (newCharacter === characters.MASON && !masonInGame) {
          // Last player don't add masons
          if (count === playersLeftOver - 1) {
            newCharacter = characters.DOPPELGANGER;
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
