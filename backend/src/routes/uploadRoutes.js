import { Router } from 'express';
import { uploadController } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { presignSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate);

// Returns a presigned (S3) or local upload target for a meeting photo.
router.post('/presign', validate(presignSchema), uploadController.presign);

export default router;
