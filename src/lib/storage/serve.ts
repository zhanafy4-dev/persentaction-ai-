import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { contentTypeFromKey } from "./contentType";
import type { StorageDriver } from "./StorageDriver";

export async function serveStorageObject(
  driver: StorageDriver,
  key: string,
  headers: {
    cacheControl: string;
    contentDisposition?: string;
    attachment?: boolean;
  },
) {
  const remoteUrl = await driver.getPublicUrl(key, headers.attachment ? { attachment: true } : undefined);
  if (remoteUrl) {
    return NextResponse.redirect(remoteUrl, {
      status: 302,
      headers: { "cache-control": headers.cacheControl },
    });
  }

  const filePath = driver.resolvePath(key);
  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat) return NextResponse.json({ error: "Missing file" }, { status: 404 });

  const stream = createReadStream(filePath);
  const h: Record<string, string> = {
    "content-type": contentTypeFromKey(key),
    "content-length": String(stat.size),
    "cache-control": headers.cacheControl,
  };
  if (headers.contentDisposition) h["content-disposition"] = headers.contentDisposition;

  return new Response(stream as unknown as ReadableStream, { headers: h });
}
