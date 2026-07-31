// S3 storage — issues presigned PUT URLs so the browser uploads directly to S3,
// bypassing Lambda's payload limit.
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
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
  'application/octet-stream': 'bin',
};

const extFromName = (name = '') => {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(name.trim());
  return m ? m[1].toLowerCase() : null;
};

/**
 * Prefer the mapped extension for a known content type. For the generic
 * `application/octet-stream` (what a browser reports when `File.type` is
 * empty) fall back to the original filename's extension so the stored object
 * is still recognisable on download.
 */
const resolveExt = (ct = '', filename = '') => {
  if (ct === 'application/octet-stream') return extFromName(filename) || 'bin';
  if (EXT_BY_CONTENT_TYPE[ct]) return EXT_BY_CONTENT_TYPE[ct];
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  return extFromName(filename) || 'jpg';
};

export function createS3Storage() {
  const client = new S3Client(awsClientConfig());

  return {
    provider: 's3',

    // Presigned PUT so the browser uploads the file directly to the (private)
    // bucket. `prefix` scopes the key path (default 'photos', e.g. 'announcements').
    async presignUpload({ contentType = 'image/jpeg', prefix = 'photos', filename = '' }) {
      const [yyyy, mm] = monthKey().split('-');
      const key = `${prefix}/${yyyy}/${mm}/${newId()}.${resolveExt(contentType, filename)}`;
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

    /**
     * Size in bytes of an uploaded object, or `null` when that can't be
     * determined. Distinguishes three outcomes deliberately:
     *   number -> the object exists and this is its size
     *   'MISSING' -> no such object (a client-supplied key that was never uploaded)
     *   null -> the bucket couldn't be asked (e.g. IAM lacks s3:GetObject)
     * The caller decides the policy for each; see meetingService.
     */
    async getObjectSize(key) {
      if (!key) return 'MISSING';
      try {
        const res = await client.send(new HeadObjectCommand({ Bucket: env.s3Bucket, Key: key }));
        return typeof res.ContentLength === 'number' ? res.ContentLength : null;
      } catch (e) {
        if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) return 'MISSING';
        return null;
      }
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
