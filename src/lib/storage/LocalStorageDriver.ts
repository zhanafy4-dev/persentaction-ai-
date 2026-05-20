import path from "node:path";
import fs from "node:fs/promises";
import type { StorageDriver, PutFileArgs } from "./StorageDriver";

function safeJoin(root: string, key: string) {
  const clean = key.replace(/^[\\/]+/, "").replace(/\.\.(\/|\\)/g, "");
  const p = path.join(root, clean);
  const resolvedRoot = path.resolve(root);
  const resolvedP = path.resolve(p);
  if (!resolvedP.startsWith(resolvedRoot)) throw new Error("Invalid storage key.");
  return resolvedP;
}

export class LocalStorageDriver implements StorageDriver {
  constructor(private rootDir: string) {}

  resolvePath(key: string) {
    return safeJoin(this.rootDir, key);
  }

  async putFile({ key, bytes }: PutFileArgs) {
    const outPath = this.resolvePath(key);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, bytes);
  }

  async deleteFile(key: string) {
    const p = this.resolvePath(key);
    await fs.rm(p, { force: true });
  }
}

