// Server-side verification for anything the browser uploaded via a presigned
// PUT. Shared by every upload path in the product (meeting photos, the Direct
// Conversion screenshot, announcement image attachments) so the rule is
// defined once rather than drifting per feature.
//
// Why this has to exist: the browser uploads straight to S3 with a presigned
// PUT, which carries NO size condition. That means the client-side limit is
// only a UX affordance — a caller can upload a file of any size, or reference
// a key it never uploaded at all, and the request body is the only thing
// saying otherwise. Asking the bucket for the real object closes both gaps.
import { storage } from '../storage/index.js';
import { logger } from '../lib/logger.js';
import { IMAGE_UPLOAD_MAX_BYTES } from '../config/constants.js';
import { BadRequestError } from '../lib/errors.js';

export const asMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/** Is this attachment/upload an image, by declared content type? */
export const isImageContentType = (contentType) => !!contentType?.startsWith('image/');

/**
 * Assert that every referenced object exists and is within the image size cap.
 *
 * @param {Array<{key: string, label: string}>} entries
 * @param {number} [maxBytes]  Defaults to the global image cap.
 *
 * Policy, deliberately different per failure mode:
 *   - object missing   -> reject (a key that was never uploaded)
 *   - object too large -> reject
 *   - size unknowable  -> allow, but log. The bucket being unqueryable is an
 *                         infrastructure/IAM problem; failing every submission
 *                         over it would take the whole product down, so this
 *                         one degrades instead of blocking.
 */
export async function assertUploadedImages(entries, maxBytes = IMAGE_UPLOAD_MAX_BYTES) {
  await Promise.all(
    entries.map(async ({ key, label }) => {
      const size = await storage.getObjectSize(key);

      if (size === 'MISSING') {
        throw new BadRequestError(`${label} was not uploaded successfully — please attach it again.`);
      }
      if (size === null) {
        logger.warn('Could not verify uploaded object size; allowing through', { key });
        return;
      }
      if (size > maxBytes) {
        throw new BadRequestError(
          `${label} is ${asMb(size)} — images must be ${asMb(maxBytes)} or smaller.`
        );
      }
    })
  );
}

export default assertUploadedImages;
