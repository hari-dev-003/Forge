import { Router } from 'express';
import { announcementController } from '../controllers/announcementController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createAnnouncementSchema, updateAnnouncementSchema, announcementQuerySchema } from '../validators/schemas.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate);

router.post('/', authorize(ROLES.ADMIN), validate(createAnnouncementSchema), announcementController.create);
router.get('/', validate(announcementQuerySchema, 'query'), announcementController.list);
router.get('/:id', announcementController.getById);
router.get('/:id/related', announcementController.related);
router.patch('/:id', authorize(ROLES.ADMIN), validate(updateAnnouncementSchema), announcementController.update);
router.delete('/:id', authorize(ROLES.ADMIN), announcementController.remove);
router.post('/:id/read', announcementController.markRead);

export default router;
