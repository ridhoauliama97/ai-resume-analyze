import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { ResumeStorage } from './types';

export function createSupabaseResumeStorage(opts: {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}): ResumeStorage {
  const client = new S3Client({
    forcePathStyle: true,
    region: opts.region,
    endpoint: opts.endpoint,
    credentials: {
      accessKeyId: opts.accessKeyId,
      secretAccessKey: opts.secretAccessKey,
    },
  });

  return {
    async upload({ key, body, contentType }) {
      await client.send(
        new PutObjectCommand({
          Bucket: opts.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    },
    async remove(key) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: opts.bucket,
          Key: key,
        }),
      );
    },
  };
}
