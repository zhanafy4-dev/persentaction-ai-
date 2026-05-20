import path from "node:path";
import { LocalStorageDriver } from "./LocalStorageDriver";

function rootDirFromEnv(key: "UPLOADS_DIR" | "RENDERS_DIR", fallback: string) {
  const rel = process.env[key] ?? fallback;
  // Always anchor to repo root at runtime (process.cwd()).
  return path.resolve(process.cwd(), rel);
}

export const uploadsStorage = new LocalStorageDriver(rootDirFromEnv("UPLOADS_DIR", "uploads"));
export const rendersStorage = new LocalStorageDriver(rootDirFromEnv("RENDERS_DIR", "renders"));

