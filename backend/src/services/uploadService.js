import { storage } from '../storage/index.js';

export const uploadService = {
  /** Issue a presigned/local upload target for a meeting photo. */
  async presign({ contentType }, baseUrl) {
    return storage.presignUpload({ contentType, baseUrl });
  },
};

export default uploadService;
