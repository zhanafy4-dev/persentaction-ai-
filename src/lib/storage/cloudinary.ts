import { v2 as cloudinary } from "cloudinary";

let configured = false;

export function ensureCloudinaryConfig() {
  if (configured) return;
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET.");
  }
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  configured = true;
}

export function publicIdFromKey(folderPrefix: string, key: string) {
  const base = key.replace(/\.[^/.]+$/, "").replace(/\\/g, "/");
  return `${folderPrefix}/${base}`;
}

export function formatFromKey(key: string) {
  const m = key.match(/\.([a-z0-9]+)$/i);
  return m?.[1]?.toLowerCase();
}
