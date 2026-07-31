// S3 storage — issues presigned PUT URLs so the browser uploads directly to S3,
// bypassing Lambda's payload limit.
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import express from 'express';
import { env, awsClientConfig } from '../config/env.js';
import { newId, monthKey } from '../lib/ids.js';

// Meeting/screenshot photos only ever needed jpg/png/webp; announcement
// attachments extend this to common office-document formats.
const EXT_BY_CONTENT_TYPE = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
};

const extFromContentType = (ct = '') => {
  if (EXT_BY_CONTENT_TYPE[ct]) return EXT_BY_CONTENT_TYPE[ct];
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  return 'jpg';
};

export function createS3Storage() {
  const client = new S3Client(awsClientConfig());

  return {
    provider: 's3',

    // Presigned PUT so the browser uploads the file directly to the (private)
    // bucket. `prefix` scopes the key path (default 'photos', e.g. 'announcements').
    async presignUpload({ contentType = 'image/jpeg', prefix = 'photos' }) {
      const [yyyy, mm] = monthKey().split('-');
      const key = `${prefix}/${yyyy}/${mm}/${newId()}.${extFromContentType(contentType)}`;
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
