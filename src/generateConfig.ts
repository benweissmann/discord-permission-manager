import {
  Category,
  Channel,
  PermissionOverwrite,
  ReferencedRole,
  ReferencedUser,
} from "./loadDiscordData";

function categoryHeader(category: Category): string {
  const divider = "#".repeat(category.name.length + 4);
  return `
${divider}
# ${category.name} #
${divider}
  `.trim();
}

function categoryBlock(category: Category): string {
  return `
resource "discord_category_channel" "${category.tfName}" {
  name      = "${category.name}"
  position  = ${category.position}
  server_id = local.server_id
  type      = "category"
}
  `.trim();
}

function channelResource(channelOrCategory: Channel | Category): string {
  if (!("kind" in channelOrCategory)) {
    return "discord_category_channel";
  } else if (channelOrCategory.kind === "text") {
    return "discord_text_channel";
  } else {
    return "discord_voice_channel";
  }
}

function channelBlock(channel: Channel, category: Category | null): string {
  let categoryLine = "";
  if (category) {
    categoryLine = `\n  category                 = discord_category_channel.${category.tfName}.id`;
  }

  // A note about sync_perms_with_category: this is a "feature" of the Terraform
  // provider, not the Discord API. Unfortunately, it defaults to "true" and
  // the provider calculates the "current" value based on whether the permissions
  // are currently synced. However, setting it to "false" just disables the syncing
  // behavior in the provider, which is probably what we want -- but we also have
  // to add an ignore_changes lifecycle block to prevent the provider from
  // reporting this as a "change" for every channel where the permissions do
  // match the parent.

  return `
resource "${channelResource(channel)}" "${channel.tfName}" {
  name                     = "${channel.name}"${categoryLine}
  position                 = ${channel.position}
  server_id                = local.server_id

  sync_perms_with_category = false
  lifecycle { ignore_changes = [ sync_perms_with_category ] }
}
  `.trim();
}

function channelPermissionBlock(
  overwrite: PermissionOverwrite,
  channelOrCategory: Channel | Category,
  {
    referencedUsers,
    referencedRoles,
  }: {
    referencedUsers: { [id: string]: ReferencedUser };
    referencedRoles: { [id: string]: ReferencedRole };
  }
): string {
  const permissionNames = [...overwrite.allow, overwrite.deny];
  const padLength = Math.max(...permissionNames.map(name => name.length)) + 1;

  const permissionLines = overwrite.allow
    .map(allow => `  ${allow.padEnd(padLength)} = "allow"`)
    .concat(overwrite.deny.map(deny => `  ${deny.padEnd(padLength)} = "deny"`))
    .join("\n");

  let targetReference: string;
  if (overwrite.targetType === "user") {
    targetReference = `data.discord_member.${referencedUsers[overwrite.targetId].tfName}`;
  } else {
    targetReference = `data.discord_role.${referencedRoles[overwrite.targetId].tfName}`;
  }

  return `
data discord_permission "${overwrite.tfName}" {
${permissionLines}
}
resource "discord_channel_permission" "${overwrite.tfName}" {
  channel_id   = ${channelResource(channelOrCategory)}.${channelOrCategory.tfName}.id
  type         = "${overwrite.targetType}"
  overwrite_id = ${targetReference}.id
  allow        = data.discord_permission.${overwrite.tfName}.allow_bits
  deny         = data.discord_permission.${overwrite.tfName}.deny_bits
}
  `.trim();
}

export default function generateConfig({
  referencedUsers,
  referencedRoles,
  channels,
  categories,
}: {
  referencedUsers: { [id: string]: ReferencedUser };
  referencedRoles: { [id: string]: ReferencedRole };
  channels: Channel[];
  categories: Category[];
}): string {
  const stanzas: string[] = [];

  categories.sort((a, b) => a.position - b.position);
  channels.sort((a, b) => a.position - b.position);

  const noCategoryChannels = channels.filter(channel => !channel.parent);
  if (noCategoryChannels.length > 0) {
    for (const channel of noCategoryChannels) {
      stanzas.push(channelBlock(channel, null));

      for (const permission of channel.permissionOverwrites) {
        stanzas.push(
          channelPermissionBlock(permission, channel, {
            referencedUsers,
            referencedRoles,
          })
        );
      }
    }
  }

  for (const category of categories) {
    stanzas.push(categoryHeader(category));
    stanzas.push(categoryBlock(category));

    for (const permission of category.permissionOverwrites) {
      stanzas.push(
        channelPermissionBlock(permission, category, {
          referencedUsers,
          referencedRoles,
        })
      );
    }

    const categoryChannels = channels.filter(
      channel => channel.parent === category.id
    );

    for (const channel of categoryChannels) {
      stanzas.push(channelBlock(channel, category));

      for (const permission of channel.permissionOverwrites) {
        stanzas.push(
          channelPermissionBlock(permission, channel, {
            referencedUsers,
            referencedRoles,
          })
        );
      }
    }
  }

  return stanzas.join("\n\n");
}
