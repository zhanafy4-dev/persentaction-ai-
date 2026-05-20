import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import type { PutFileArgs, StorageDriver } from "./StorageDriver";
import { ensureCloudinaryConfig, formatFromKey, publicIdFromKey } from "./cloudinary";

export class CloudinaryStorageDriver implements StorageDriver {
  readonly kind = "cloudinary" as const;

  constructor(
    private folderPrefix: string,
    private resourceType: "image" | "video",
  ) {
    ensureCloudinaryConfig();
  }

  private publicId(key: string) {
    return publicIdFromKey(this.folderPrefix, key);
  }

  async putFile({ key, bytes, contentType }: PutFileArgs) {
    const public_id = this.publicId(key);
    const format = formatFromKey(key);

    await new Promise<void>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          public_id,
          resource_type: this.resourceType,
          overwrite: true,
          ...(format ? { format } : {}),
          ...(contentType ? { context: `content_type=${contentType}` } : {}),
        },
        (err) => (err ? reject(err) : resolve()),
      );
      upload.end(bytes);
    });
  }

  async deleteFile(key: string) {
    const public_id = this.publicId(key);
    await cloudinary.uploader.destroy(public_id, { resource_type: this.resourceType });
  }

  resolvePath(key: string): string {
    void key;
    throw new Error("Cloudinary storage has no local resolvePath; use materializeLocal or getPublicUrl.");
  }

  async getPublicUrl(key: string, opts?: { attachment?: boolean }) {
    const public_id = this.publicId(key);
    const format = formatFromKey(key);
    return cloudinary.url(public_id, {
      secure: true,
      resource_type: this.resourceType,
      ...(format ? { format } : {}),
      ...(opts?.attachment ? { flags: "attachment" } : {}),
    });
  }

  async materializeLocal(key: string) {
    const url = await this.getPublicUrl(key);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${key} from Cloudinary (${res.status}).`);

    const safeName = key.replace(/[/\\]/g, "_");
    const outPath = path.join(os.tmpdir(), "cinematic-story", this.folderPrefix, safeName);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, Buffer.from(await res.arrayBuffer()));
    return outPath;
  }
}
