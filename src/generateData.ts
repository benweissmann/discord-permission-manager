import { ReferencedRole, ReferencedUser } from "./loadDiscordData";

function localsBlock(serverId: string): string {
  return `
locals {
  server_id = "${serverId}"
}
  `.trim();
}

function userData(user: ReferencedUser): string {
  return `
data "discord_member" "${user.tfName}" {
  server_id = local.server_id
  user_id   = "${user.id}"
}
  `.trim();
}

function roleData(role: ReferencedRole): string {
  return `
data "discord_role" "${role.tfName}" {
  server_id = local.server_id
  role_id   = "${role.id}"
}
  `.trim();
}

export default function generateData({
  serverId,
  referencedUsers,
  referencedRoles,
}: {
  serverId: string;
  referencedUsers: { [id: string]: ReferencedUser };
  referencedRoles: { [id: string]: ReferencedRole };
}): string {
  const stanzas: string[] = [localsBlock(serverId)];

  for (const user of Object.values(referencedUsers)) {
    stanzas.push(userData(user));
  }

  for (const role of Object.values(referencedRoles)) {
    stanzas.push(roleData(role));
  }

  return stanzas.join("\n\n") + "\n";
}
