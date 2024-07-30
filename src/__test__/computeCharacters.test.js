const computeCharacters = require("../util/computeCharacters");
jest.mock("../werewolf_db", () => {
  return {
    findSettings: () => ({
      extra_characters: true,
      allow_vampires: true,
      can_whisper: false,
      allow_reactions: true,
      wolf_kills_witch: false,
      hard_mode: false,
      allow_first_bite: true,
      king_bite_wolf_safe: false,
      king_victim_attack_safe: true,
      random_cards: true,
      bodyguard_joins_masons: true,
      seer_joins_masons: true,
      hunter_guard: true,
      allow_chaos_demon: true,
    }),
  };
});

test("computing characters", async () => {
  const amountOfPlayers = 12;
  const characterCards = await computeCharacters(amountOfPlayers, 1);

  cardCount = {};
  characterCards.forEach((card) => {
    if (cardCount[card]) {
      cardCount[card] += 1;
    } else {
      cardCount[card] = 1;
    }
  });

  console.log(cardCount);

  if (cardCount["baker"]) {
    expect(cardCount["baker"]).toBeLessThanOrEqual(1)
  }
  if (cardCount["witch"]) {
    expect(cardCount["witch"]).toBeLessThanOrEqual(1)
  }
  if (cardCount["king"]) {
    expect(cardCount["king"]).toBeLessThanOrEqual(1)
  }
  expect(characterCards.length).toBe(amountOfPlayers)
});
