const computeCharacters = require("../util/computeCharacters");
jest.mock("../werewolf_db", () => {
  return {
    findSettings: () => ({ extra_characters: false, allow_vampires: true }),
  };
});

test("computing characters", async () => {
  const amountOfPlayers = 100;
  const characterCards = await computeCharacters(amountOfPlayers, 1);

  console.log(characterCards);
  cardCount = {};
  characterCards.forEach((card) => {
    if (cardCount[card]) {
      cardCount[card] += 1;
    } else {
      cardCount[card] = 1;
    }
  });

  console.log(cardCount);

  console.log(characterCards.filter((w) => w === "werewolf").length);
  console.log(characterCards.filter((w) => w === "werewolf cub").length);

  const totalWerewolves = characterCards.filter(
    (w) => w === "werewolf" || w === "werewolf cub"
  );

  expect(totalWerewolves.length).toBe(Math.floor(amountOfPlayers / 5));
});
