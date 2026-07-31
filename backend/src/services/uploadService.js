import { storage } from '../storage/index.js';

export const uploadService = {
  /** Issue a presigned/local upload target (meeting photo, announcement attachment, ...). */
  async presign({ contentType, prefix }, baseUrl) {
    return storage.presignUpload({ contentType, prefix, baseUrl });
  },
};

export default uploadService;
