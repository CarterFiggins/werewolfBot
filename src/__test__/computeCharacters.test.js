const computeCharacters = require("../util/computeCharacters");
jest.mock("../werewolf_db", () => {
  return {
    findSettings: () => ({ extra_characters: true, allow_vampires: true }),
  };
});

test("computing characters", async () => {
  const amountOfPlayers = 20;
  const characterCards = await computeCharacters(amountOfPlayers, 1);

  console.log("characterCards in game");
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

  console.log("werewolf length");
  console.log(characterCards.filter((w) => w === "werewolf").length);
  console.log("werewolf cub length");
  console.log(characterCards.filter((w) => w === "werewolf cub").length);

  const totalWerewolves = characterCards.filter(
    (w) => w === "werewolf" || w === "werewolf cub"
  );

  expect(totalWerewolves.length).toBe(Math.floor(amountOfPlayers / 7));
});
