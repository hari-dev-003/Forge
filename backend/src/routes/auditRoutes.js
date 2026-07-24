import { Router } from 'express';
import { auditController } from '../controllers/auditController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { auditQuerySchema } from '../validators/schemas.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize(ROLES.ADMIN), validate(auditQuerySchema, 'query'), auditController.list);

export default router;
