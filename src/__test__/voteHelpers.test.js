const { handleHangingVotes } = require("../util/voteHelpers");
const { getCountedVotes, findSettings, findUser, deleteManyVotes } = require("../werewolf_db");
const { removesDeadPermissions } = require("../util/deathHelper");
const { isDeadChaosTarget } = require("../util/characterHelpers/chaosDemonHelpers");
const _ = require("lodash");

jest.mock("../werewolf_db", () => ({
  getCountedVotes: jest.fn(),
  findSettings: jest.fn(),
  findUser: jest.fn(),
  deleteManyVotes: jest.fn(),
}));

jest.mock("../util/deathHelper", () => ({
  removesDeadPermissions: jest.fn(),
  WaysToDie: { HANGED: "hanged" },
}));

jest.mock("../util/characterHelpers/chaosDemonHelpers", () => ({
  isDeadChaosTarget: jest.fn(),
}));

jest.mock("lodash", () => ({
  ...jest.requireActual("lodash"),
  shuffle: jest.fn((array) => array), // Mock shuffle to return the array as is for predictability
}));

describe("handleHangingVotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockInteraction = {
    guild: {
      id: "guild1",
      members: {
        cache: new Map([
          ["user1", { id: "user1" }],
          ["user2", { id: "user2" }],
        ]),
      },
    },
  };

  test("handles no votes scenario", async () => {
    findSettings.mockResolvedValue({ double_hanging: false });
    getCountedVotes.mockResolvedValue({
      toArray: async () => [],
    });

    const result = await handleHangingVotes(mockInteraction);

    expect(result).toEqual([]);
  });

  test("handles voted off players", async () => {
    findSettings.mockResolvedValue({ double_hanging: false });
    getCountedVotes.mockResolvedValue({
      toArray: async () => [
        { _id: { voted_user_id: "user1" }, count: 5 },
      ],
    });
    findUser.mockResolvedValue({ id: "user1" });
    removesDeadPermissions.mockResolvedValue("role_removed");
    isDeadChaosTarget.mockResolvedValue(false);

    const result = await handleHangingVotes(mockInteraction);

    expect(result).toEqual([
      {
        chaosWins: false,
        deathCharacter: "role_removed",
        member: { id: "user1" },
        user: { id: "user1" },
        random: false,
      },
    ]);
  });

  test("handles random vote offs", async () => {
    findSettings.mockResolvedValue({ double_hanging: true });
    getCountedVotes.mockResolvedValue({
      toArray: async () => [
        { _id: { voted_user_id: "user1" }, count: 5 },
        { _id: { voted_user_id: "user2" }, count: 5 },
      ],
    });
    findUser.mockResolvedValueOnce({ id: "user1" });
    findUser.mockResolvedValueOnce({ id: "user2" });
    removesDeadPermissions.mockResolvedValue("role_removed");
    isDeadChaosTarget.mockResolvedValue(false);

    const result = await handleHangingVotes(mockInteraction);

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ member: { id: "user1" } }),
        expect.objectContaining({ member: { id: "user2" } }),
      ])
    );
  });
});