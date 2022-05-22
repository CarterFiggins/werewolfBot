const _ = require("lodash");
const { onDmChannel } = require("./channelHelpers");

async function permissionCheck({ interaction, guildOnly, check }) {
  if (guildOnly && (await onDmChannel(interaction))) {
    return "Not a DM command";
  }
  if (check()) {
    return "Permission denied";
  }
}

module.exports = {
  permissionCheck,
};
