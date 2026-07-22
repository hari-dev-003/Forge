// S3 storage — issues presigned PUT URLs so the browser uploads directly to S3,
// bypassing Lambda's payload limit.
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import express from 'express';
import { env, awsClientConfig } from '../config/env.js';
import { newId, monthKey } from '../lib/ids.js';

const extFromContentType = (ct = '') =>
  ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';

export function createS3Storage() {
  const client = new S3Client(awsClientConfig());

  return {
    provider: 's3',

    // Presigned PUT so the browser uploads the photo directly to the (private) bucket.
    async presignUpload({ contentType = 'image/jpeg' }) {
      const [yyyy, mm] = monthKey().split('-');
      const key = `photos/${yyyy}/${mm}/${newId()}.${extFromContentType(contentType)}`;
      const cmd = new PutObjectCommand({
        Bucket: env.s3Bucket,
        Key: key,
        ContentType: contentType,
      });
      const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: env.s3PresignExpires });
      return {
        key,
        method: 'PUT',
        uploadUrl,
        headers: { 'Content-Type': contentType },
      };
    },

    // Short-lived presigned GET so photos can be viewed without a public bucket.
    async getViewUrl(key) {
      if (!key) return null;
      const cmd = new GetObjectCommand({ Bucket: env.s3Bucket, Key: key });
      return getSignedUrl(client, cmd, { expiresIn: env.s3ViewExpires });
    },

    // No app-hosted routes needed for S3 (uploads/downloads go straight to the bucket).
    router() {
      return express.Router();
    },
  };
}

export default createS3Storage;
