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
    // Proxy through our API so the browser triggers a real file download (Cloudinary CORS-safe).
    if (headers.contentDisposition) {
      const res = await fetch(remoteUrl);
      if (!res.ok) return NextResponse.json({ error: "Missing file" }, { status: 404 });
      const h: Record<string, string> = {
        "content-type": res.headers.get("content-type") ?? contentTypeFromKey(key),
        "cache-control": headers.cacheControl,
        "content-disposition": headers.contentDisposition,
      };
      const len = res.headers.get("content-length");
      if (len) h["content-length"] = len;
      return new Response(res.body, { headers: h });
    }
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
