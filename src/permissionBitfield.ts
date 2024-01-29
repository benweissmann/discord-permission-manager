// mapping of permissions supported by the terraform plugin to
// the bitfield for that permission in the permission map.

// https://github.com/aequasi/terraform-provider-discord/blob/7565cb67598b2e9b62c2f1c5dd42768b8e4f7aad/discord/data_source_discord_permission.go#L15-47

export const permissionMap = {
  create_instant_invite: 0x00000001,
  kick_members: 0x00000002,
  ban_members: 0x00000004,
  administrator: 0x00000008,
  manage_channels: 0x000000010,
  manage_guild: 0x000000020,
  add_reactions: 0x000000040,
  view_audit_log: 0x000000080,
  priority_speaker: 0x000000100,
  stream: 0x000000200,
  view_channel: 0x000000400,
  send_messages: 0x000000800,
  send_tts_messages: 0x000001000,
  manage_messages: 0x00002000,
  embed_links: 0x00004000,
  attach_files: 0x00008000,
  read_message_history: 0x00010000,
  mention_everyone: 0x00020000,
  use_external_emojis: 0x00040000,
  view_guild_insights: 0x00080000,
  connect: 0x00100000,
  speak: 0x00200000,
  mute_members: 0x00400000,
  deafen_members: 0x00800000,
  move_members: 0x01000000,
  use_vad: 0x02000000,
  change_nickname: 0x04000000,
  manage_nicknames: 0x08000000,
  manage_roles: 0x10000000,
  manage_webhooks: 0x20000000,
  manage_emojis: 0x40000000,
  request_to_speak: 0x100000000,
  manage_threads: 0x400000000,
  create_public_threads: 0x800000000,
  create_private_threads: 0x1000000000,
  use_external_stickers: 0x2000000000,
  send_thread_messages: 0x4000000000,
};

export type PermissionName = keyof typeof permissionMap;

export function decodePermissionOvewrwriteBitfield(
  bitfield: string
): PermissionName[] {
  const bitfieldNumber = parseInt(bitfield, 10);
  const permissions: PermissionName[] = [];

  for (const [permissionName, permissionBitfield] of Object.entries(
    permissionMap
  )) {
    if (bitfieldNumber & permissionBitfield) {
      permissions.push(permissionName as PermissionName);
    }
  }

  return permissions;
}
