import {
  decodePermissionOvewrwriteBitfield,
  PermissionName,
} from "./permissionBitfield";
import { createTfName } from "./tfNames";
import {
  Routes,
  ChannelType,
  APIGuildChannel,
  APIGuildMember,
  APIRole,
  APIOverwrite,
  OverwriteType,
} from "discord-api-types/v10";
import { REST } from "discord.js";

export type PermissionOverwrite = {
  tfName: string;
  targetId: string;
  targetType: "role" | "user";
  allow: PermissionName[];
  deny: PermissionName[];
};

export type Channel = {
  id: string;
  name: string;
  kind: "text" | "voice";
  parent: string | null;
  position: number;
  permissionOverwrites: PermissionOverwrite[];
  tfName: string;
};

export type Category = {
  id: string;
  name: string;
  position: number;
  permissionOverwrites: PermissionOverwrite[];
  tfName: string;
};

export type ReferencedUser = {
  id: string;
  name: string;
  tfName: string;
};

export type ReferencedRole = {
  id: string;
  name: string;
  tfName: string;
};

export default async function loadDiscordData(
  client: REST,
  serverId: string
): Promise<{
  channels: Channel[];
  categories: Category[];
  referencedUsers: { [id: string]: ReferencedUser };
  referencedRoles: { [id: string]: ReferencedRole };
}> {
  const referencedUsers: { [id: string]: ReferencedUser } = {};
  const referencedRoles: { [id: string]: ReferencedRole } = {};

  function decodePermissionOverwrite(
    overwrite: APIOverwrite,
    {
      channelName,
      userNames,
      roleNames,
    }: {
      channelName: string;
      userNames: { [id: string]: string };
      roleNames: { [id: string]: string };
    }
  ): PermissionOverwrite {
    let targetName: string;
    if (overwrite.type === OverwriteType.Member) {
      if (!referencedUsers[overwrite.id]) {
        referencedUsers[overwrite.id] = {
          id: overwrite.id,
          name: userNames[overwrite.id],
          tfName: createTfName("user", userNames[overwrite.id]),
        };
      }

      targetName = userNames[overwrite.id];
    } else {
      if (!referencedRoles[overwrite.id]) {
        referencedRoles[overwrite.id] = {
          id: overwrite.id,
          name: roleNames[overwrite.id],
          tfName: createTfName("role", roleNames[overwrite.id]),
        };
      }

      targetName = roleNames[overwrite.id];
    }

    return {
      targetId: overwrite.id,
      targetType: overwrite.type === OverwriteType.Role ? "role" : "user",
      allow: decodePermissionOvewrwriteBitfield(overwrite.allow),
      deny: decodePermissionOvewrwriteBitfield(overwrite.deny),
      tfName: createTfName("permission", `${channelName}_${targetName}`),
    };
  }

  const apiUsers = (await client.get(
    Routes.guildMembers(serverId)
  )) as APIGuildMember[];

  const userNames: { [id: string]: string } = {};
  for (const apiUser of apiUsers) {
    if (apiUser.user) {
      userNames[apiUser.user.id] = apiUser.user.username;
    }
  }

  const apiRoles = (await client.get(Routes.guildRoles(serverId))) as APIRole[];

  const roleNames: { [id: string]: string } = {};
  for (const apiRole of apiRoles) {
    roleNames[apiRole.id] = apiRole.name;
  }

  const apiChannels = (await client.get(
    Routes.guildChannels(serverId)
  )) as APIGuildChannel<any>[];

  const channels: Channel[] = [];
  const categories: Category[] = [];

  for (const apiChannel of apiChannels) {
    if (apiChannel.type === ChannelType.GuildCategory) {
      categories.push({
        id: apiChannel.id,
        name: apiChannel.name,
        position: apiChannel.position,
        tfName: createTfName("category", apiChannel.name),
        permissionOverwrites:
          apiChannel.permission_overwrites?.map(o =>
            decodePermissionOverwrite(o, {
              channelName: apiChannel.name,
              userNames,
              roleNames,
            })
          ) ?? [],
      });
    } else if (
      apiChannel.type === ChannelType.GuildText ||
      apiChannel.type === ChannelType.GuildVoice
    ) {
      channels.push({
        id: apiChannel.id,
        name: apiChannel.name,
        kind: apiChannel.type === ChannelType.GuildText ? "text" : "voice",
        parent: apiChannel.parent_id ?? null,
        position: apiChannel.position,
        tfName: createTfName("channel", apiChannel.name),
        permissionOverwrites:
          apiChannel.permission_overwrites?.map(o =>
            decodePermissionOverwrite(o, {
              channelName: apiChannel.name,
              userNames,
              roleNames,
            })
          ) ?? [],
      });
    }
  }

  return { channels, categories, referencedUsers, referencedRoles };
}
