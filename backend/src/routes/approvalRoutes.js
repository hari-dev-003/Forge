import { Router } from 'express';
import { approvalController } from '../controllers/approvalController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate);

// Review queue (default PENDING) for the manager's team / all for admin.
router.get('/queue', authorize(ROLES.MANAGER, ROLES.ADMIN), approvalController.queue);

export default router;
