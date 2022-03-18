const computeCharacters = require("../util/computeCharacters");

test("jest mocking", async () => {
  const test = computeCharacters(16);

  console.log(test);

  console.log(test.filter((w) => w === "werewolf").length);
  console.log(test.filter((w) => w === "werewolf cub").length);

  expect(1).toBe(1);
});
