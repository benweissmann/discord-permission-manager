import { Category, Channel, PermissionOverwrite } from "./loadDiscordData";

function textChannelImport(channel: Channel): string {
  return `
import {
  to = discord_text_channel.${channel.tfName}
  id = "${channel.id}"
}
  `.trim();
}

function voiceChannelImport(channel: Channel): string {
  return `
import {
  to = discord_voice_channel.${channel.tfName}
  id = "${channel.id}"
}
  `.trim();
}

function categoryImport(category: Category): string {
  return `
import {
  to = discord_category_channel.${category.tfName}
  id = "${category.id}"
}
  `.trim();
}

function channelPermissionImport(
  parent: Channel | Category,
  permission: PermissionOverwrite
): string {
  return `
import {
  to = discord_channel_permission.${permission.tfName}
  id = "${parent.id}:${permission.targetId}:${permission.targetType}"
}
  `.trim();
}

export default function generateImports({
  channels,
  categories,
}: {
  channels: Channel[];
  categories: Category[];
}): string {
  const stanzas: string[] = [];

  for (const category of categories) {
    stanzas.push(categoryImport(category));

    for (const permission of category.permissionOverwrites) {
      stanzas.push(channelPermissionImport(category, permission));
    }
  }

  for (const channel of channels) {
    if (channel.kind === "text") {
      stanzas.push(textChannelImport(channel));
    } else if (channel.kind === "voice") {
      stanzas.push(voiceChannelImport(channel));
    }

    for (const permission of channel.permissionOverwrites) {
      stanzas.push(channelPermissionImport(channel, permission));
    }
  }

  return stanzas.join("\n\n") + "\n";
}
