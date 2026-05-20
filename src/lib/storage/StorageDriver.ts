export type PutFileArgs = {
  key: string;
  bytes: Buffer;
  contentType?: string;
};

export type StorageDriverKind = "local" | "cloudinary";

export interface StorageDriver {
  readonly kind: StorageDriverKind;
  putFile(args: PutFileArgs): Promise<void>;
  deleteFile(key: string): Promise<void>;
  /** Local disk path (local driver only). */
  resolvePath(key: string): string;
  /** HTTPS URL for browser/ffmpeg; null when serving from disk via API. */
  getPublicUrl(key: string, opts?: { attachment?: boolean }): Promise<string | null>;
  /** Local path for FFmpeg (downloads from Cloudinary when remote). */
  materializeLocal(key: string): Promise<string>;
}

