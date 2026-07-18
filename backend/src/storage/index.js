// Storage — S3 presigned uploads (the only backend).
import { createS3Storage } from './s3Storage.js';

export const storage = createS3Storage();

export default storage;
