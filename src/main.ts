import config from "./config";
import generateConfig from "./generateConfig";
import generateData from "./generateData";
import generateImports from "./generateImports";
import loadDiscordData from "./loadDiscordData";
import resetStateOrAbort from "./resetState";
import { REST } from "@discordjs/rest";
import fs from "fs/promises";
import path from "path";

async function main() {
  await resetStateOrAbort();

  const client = new REST({ version: "10" }).setToken(config.DPM_BOT_TOKEN);
  const serverId = config.DPM_SERVER_ID;

  console.log("Loading Discord data...");
  const discordData = await loadDiscordData(client, serverId);

  console.log("Generating Terraform imports...");
  await fs.writeFile(
    path.join(__dirname, "..", "terraform", "imports.tf"),
    generateImports({
      channels: discordData.channels,
      categories: discordData.categories,
    })
  );

  console.log("Generating Terraform data blocks...");
  await fs.writeFile(
    path.join(__dirname, "..", "terraform", "data.tf"),
    generateData({
      serverId,
      referencedUsers: discordData.referencedUsers,
      referencedRoles: discordData.referencedRoles,
    })
  );

  console.log("Generating Terraform config...");
  await fs.writeFile(
    path.join(__dirname, "..", "terraform", "channels.tf"),
    generateConfig(discordData)
  );

  console.log("Done!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
