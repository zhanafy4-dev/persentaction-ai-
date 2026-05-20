import path from "node:path";
import { CloudinaryStorageDriver } from "./CloudinaryStorageDriver";
import { LocalStorageDriver } from "./LocalStorageDriver";
import type { StorageDriver } from "./StorageDriver";

function rootDirFromEnv(key: "UPLOADS_DIR" | "RENDERS_DIR", fallback: string) {
  const rel = process.env[key] ?? fallback;
  return path.resolve(process.cwd(), rel);
}

function isCloudinaryStorageEnabled() {
  if (process.env.STORAGE_DRIVER === "local") return false;
  if (process.env.STORAGE_DRIVER === "cloudinary") return true;
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function createDriver(kind: "uploads" | "renders"): StorageDriver {
  if (isCloudinaryStorageEnabled()) {
    const prefix = process.env.CLOUDINARY_FOLDER ?? "cinematic-story";
    if (kind === "uploads") {
      return new CloudinaryStorageDriver(`${prefix}/uploads`, "image");
    }
    return new CloudinaryStorageDriver(`${prefix}/renders`, "video");
  }
  return new LocalStorageDriver(rootDirFromEnv(kind === "uploads" ? "UPLOADS_DIR" : "RENDERS_DIR", kind));
}

export const uploadsStorage = createDriver("uploads");
export const rendersStorage = createDriver("renders");

export function storageMode() {
  return uploadsStorage.kind;
}
