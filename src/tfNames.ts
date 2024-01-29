const usedTfNames: { [prefix: string]: Set<string> } = {};

/**
 * Given a namespace and a name, generate a unique (for the namespace),
 * Terraform-compatible name.
 *
 * Calling this function mutates global state: we track every returned name
 * to ensure that it is unique within the namespace.
 */
export function createTfName(namespace: string, name: string): string {
  const cleanedName = name
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_/, "")
    .replace(/_$/, "");

  if (!usedTfNames[namespace]) {
    usedTfNames[namespace] = new Set();
  }

  if (!usedTfNames[namespace].has(cleanedName)) {
    usedTfNames[namespace].add(cleanedName);
    return cleanedName;
  }

  let i = 2;
  while (usedTfNames[namespace].has(`${cleanedName}-${i}`)) {
    i++;
  }

  const tfName = `${cleanedName}-${i}`;
  usedTfNames[namespace].add(tfName);
  return tfName;
}
