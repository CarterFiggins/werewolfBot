const { PermissionsBitField } = require("discord.js");

const threadPermissions = [
  PermissionsBitField.Flags.CreatePrivateThreads,
  PermissionsBitField.Flags.CreatePublicThreads,
  PermissionsBitField.Flags.SendMessagesInThreads,
];

function nonPlayersPermissions(interaction) {
  return {
    id: interaction.guild.id,
    deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, ...threadPermissions],
    allow: [PermissionsBitField.Flags.ViewChannel],
  }
}

function denyAlivePermissions(aliveRole) {
  return {
    id: aliveRole.id,
    deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, ...threadPermissions],
  };
}

function allowPermission(guildSettings) {
  let allow = [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel];

  if (guildSettings.allow_reactions) {
    allow.push(PermissionsBitField.Flags.AddReactions);
  }

  return allow
}

function getDefaultPermissions(interaction, aliveRole, deadRole) {
  return [
    deadPermissions(deadRole),
    denyAlivePermissions(aliveRole),
    nonPlayersPermissions(interaction),
  ]
}

function deadPermissions(deadRole) {
  return {
    id: deadRole.id,
    deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, ...threadPermissions],
    allow: [PermissionsBitField.Flags.ViewChannel],
  }
}

function getTownSquarePermissions(interaction, aliveRole, deadRole, guildSettings) {
  return [
    nonPlayersPermissions(interaction),
    deadPermissions(deadRole),
    {
      id: aliveRole.id,
      allow: allowPermission(guildSettings),
    },
  ]
}

function getAfterLifePermissions(interaction, aliveRole, deadRole) {
  return [
    nonPlayersPermissions(interaction),
    {
      id: aliveRole.id,
      deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, ...threadPermissions],
    },
    {
      id: deadRole.id,
      allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions],
    },
  ]
}

function createPermissions(users, characters, guildSettings) {
  let allow = [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel];

  if (guildSettings.allow_reactions) {
    allow.push(PermissionsBitField.Flags.AddReactions);
  }

  return users
    .map((user) => {
      if (characters.includes(user.info.character)) {
        return {
          id: user.id,
          allow,
        };
      }
    })
    .filter((u) => u);
}

module.exports = {
  getDefaultPermissions,
  getAfterLifePermissions,
  getTownSquarePermissions,
  createPermissions,
};