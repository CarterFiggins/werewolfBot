const _ = require("lodash");

function splitMessage(message, lastIndex = '\n', maxLength = 2000,) {
  const parts = [];
  while (message.length > 0) {
    let part = message.slice(0, maxLength);
    if (part.length === 2000) {
      const lastNewLineIndex = part.lastIndexOf(lastIndex);
      if (lastNewLineIndex > 0) {
        part = part.slice(0, lastNewLineIndex + 1);
      }
    }
    parts.push(part);
    message = message.slice(part.length);
  }
  return parts;
}

async function replyWithLongMessage({ interaction, message, lastIndex, maxLength , ephemeral = false }) {
  const messageParts = splitMessage(message, lastIndex, maxLength);
  let firstMessage = true;
  for (message of messageParts) {
    if (firstMessage) {
      await interaction.reply({ content: message, ephemeral });
      firstMessage = false;
    } else {
      await interaction.followUp({ content: message, ephemeral });
    }
  }
}

async function replyViewAll(interaction, replyList) {
  const descriptions = _.map(replyList, (listItem) => listItem.description);
      replyWithLongMessage({
        interaction,
        message: descriptions.join("\n"),
        lastIndex: '\n###',
        ephemeral: true
      })
}

module.exports = {
  replyWithLongMessage,
  replyViewAll,
}