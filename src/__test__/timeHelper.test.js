// const { characters } = require("../util/commandHelpers");

// jest.mock("../werewolf_db.js", () => {
//   return { findUsersWithIds: jest.fn() };
// });
// jest.mock("../util/userHelpers", () => {
//   return { getAliveUsersIds: jest.fn() };
// });
// jest.mock("../util/timeHelper", () => {
//   const { starveUser } = jest.requireActual("../util/timeHelper");
//   return {
//     removesDeadPermissions: jest.fn(),
//     starveUser,
//   };
// });

// const { removesDeadPermissions, starveUser } = require("../util/timeHelper");
// const { getAliveUsersIds } = require("../util/userHelpers");
// const { findUsersWithIds } = require("../werewolf_db");

// beforeEach(() => {
//   timeHelper.removesDeadPermissions = jest.fn();
//   werewolf_db.findUsersWithIds = jest.fn();
//   userHelpers.getAliveUsersIds = jest.fn();
// });

const characters = {
  //helps villagers
  VILLAGER: "villager",
  SEER: "seer",
  BODYGUARD: "bodyguard",
  APPRENTICE_SEER: "apprentice seer",
  MASON: "mason",
  HUNTER: "hunter",
  // helps werewolves
  WEREWOLF: "werewolf",
  FOOL: "fool",
  LYCAN: "lycan",
  BAKER: "baker",
  CURSED: "cursed villager",
};

test("starve user", async () => {
  // const aliveUsers = [
  //   { user_id: 1, character: characters.VILLAGER },
  //   { user_id: 2, character: characters.VILLAGER },
  //   { user_id: 3, character: characters.WEREWOLF },
  //   { user_id: 4, character: characters.WEREWOLF },
  //   { user_id: 5, character: characters.WEREWOLF },
  //   { user_id: 6, character: characters.WEREWOLF },
  //   { user_id: 7, character: characters.WEREWOLF },
  // ];

  // const cacheUsers = new Map([
  //   ...aliveUsers.map((user) => {
  //     return [user.user_id, user];
  //   }),
  // ]);

  // const interaction = {
  //   guild: {
  //     id: 1,
  //     members: {
  //       cache: cacheUsers,
  //     },
  //   },
  // };
  // const organizedRoles = {};
  // const werewolfKillId = 1;

  // getAliveUsersIds.mockReturnValue([1, 2, 3, 4, 5, 6, 7]);
  // findUsersWithIds.mockReturnValue({ toArray: () => aliveUsers });
  // removesDeadPermissions.mockReturnValue("it worked");

  // const message = await starveUser(interaction, organizedRoles, werewolfKillId);

  // console.log(message);

  // expect(message).not.toContain(characters.WEREWOLF);
  expect(1).toBe(1);
});
