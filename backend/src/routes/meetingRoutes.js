import { Router } from 'express';
import { meetingController } from '../controllers/meetingController.js';
import { approvalController } from '../controllers/approvalController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createMeetingSchema, decisionSchema } from '../validators/schemas.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate);

// Field user submits + reads own meetings
router.post('/', authorize(ROLES.USER), validate(createMeetingSchema), meetingController.create);
router.get('/mine', authorize(ROLES.USER), meetingController.listMine);

// Manager/Admin listing & review
router.get('/', authorize(ROLES.MANAGER, ROLES.ADMIN), meetingController.list);
router.post(
  '/:id/decision',
  authorize(ROLES.MANAGER, ROLES.ADMIN),
  validate(decisionSchema),
  approvalController.decide
);

// Shared (scoped inside the service)
router.get('/:id', meetingController.getById);

export default router;
