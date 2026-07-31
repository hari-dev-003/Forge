import { storage } from '../storage/index.js';

// Announcement attachments live in the same PRIVATE S3 bucket as meeting
// photos, so — exactly like photoUrls.js — we never persist a public URL.
// A short-lived presigned GET URL is attached at read time instead.
//
// Without this the stored attachment is only `{ key, fileName, contentType }`
// and the UI has nothing to point an <img> or a download link at.

export const isImageAttachment = (att) => !!att?.contentType?.startsWith('image/');

async function signed(att) {
  if (!att?.key) return att;
  return { ...att, url: await storage.getViewUrl(att.key) };
}

/** Attach a presigned view URL to every attachment — used on the detail view. */
export async function withAttachmentUrls(announcement) {
  if (!announcement?.attachments?.length) return announcement;
  return { ...announcement, attachments: await Promise.all(announcement.attachments.map(signed)) };
}

/**
 * List variant: sign only the first attachment.
 *
 * Cards only ever render attachment[0] (cover image + download link), and a
 * presigned URL is several hundred characters — signing all of them would
 * bloat a feed response for links nothing clicks. The detail view signs the
 * rest on demand.
 */
export async function withListAttachmentUrls(items) {
  return Promise.all(
    items.map(async (a) => {
      if (!a?.attachments?.length) return a;
      const [first, ...rest] = a.attachments;
      return { ...a, attachments: [await signed(first), ...rest] };
    })
  );
}

export default withAttachmentUrls;
