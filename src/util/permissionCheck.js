const _ = require("lodash");
const { onDmChannel } = require("./channelHelpers");

async function permissionCheck({ interaction, dbUser, guildOnly, check }) {
  if (guildOnly && (await onDmChannel(interaction))) {
    return "Not a DM command";
  }
  if (check && check()) {
    return "Permission denied";
  }
  if (!dbUser?.is_injured && dbUser?.is_stunned) {
    return "You are stunned and can't do this command."
  }
  if (dbUser?.is_muted) {
    return "you are muted and can't do this command."
  }
}

module.exports = {
  permissionCheck,
};
