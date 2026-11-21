export type ResumeStorage = {
  upload(input: { key: string; body: Uint8Array; contentType: string }): Promise<void>;
  remove(key: string): Promise<void>;
};
