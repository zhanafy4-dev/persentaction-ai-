export type PutFileArgs = {
  key: string;
  bytes: Buffer;
  contentType?: string;
};

export interface StorageDriver {
  putFile(args: PutFileArgs): Promise<void>;
  deleteFile(key: string): Promise<void>;
  resolvePath(key: string): string;
}

