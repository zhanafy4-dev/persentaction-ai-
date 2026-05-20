export function contentTypeFromKey(key: string, fallback = "application/octet-stream") {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  if (key.endsWith(".webm")) return "video/webm";
  if (key.endsWith(".mp4")) return "video/mp4";
  return fallback;
}
