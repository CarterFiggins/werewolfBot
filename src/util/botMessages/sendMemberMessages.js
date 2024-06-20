

async function sendMemberMessage(member, message) {
  if (!member) {
    console.log(`member did not exist. Did not send message: ${message}`)
    return;
  }

  try {
    await member.send(message);
  } catch (error) {
    console.log(member)
    console.log(`did not get message: ${message}`)
  }
}

module.exports = {
  sendMemberMessage,
}