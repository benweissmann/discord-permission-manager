import confirm from "./confirm";
import fs from "fs/promises";
import path from "path";

const STATE_FILES = [
  ".terraform",
  ".terraform.lock.hcl",
  "channels.tf",
  "data.tf",
  "imports.tf",
  "terraform.tfstate",
  "terraform.tfstate.backup",
].map(rel => path.join(__dirname, "..", "terraform", rel));

async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path);
    return true;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

export default async function resetStateOrAbort(): Promise<void> {
  const exists = await Promise.all(STATE_FILES.map(file => pathExists(file)));

  if (!exists.some(Boolean)) {
    console.log("State appears clean, proceeding...");
    return;
  }

  const confirmed = await confirm(
    "Old state exists in the terraform/ directory. Remove channels.tf, data.tf, imports.tf, and Terraform state?"
  );
  if (!confirmed) {
    console.log("Aborting.");
    process.exit(1);
  }

  console.log("State files exist, removing...");
  await Promise.all(
    STATE_FILES.map(file =>
      fs.rm(file, {
        recursive: true,
        force: true,
      })
    )
  );
  console.log("State files removed.");
}
