import { Router } from 'express';
import { configController } from '../controllers/configController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { pointsRulesSchema } from '../validators/schemas.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate);

router.get('/points', authorize(ROLES.ADMIN, ROLES.MANAGER), configController.getPointsRules);
router.put('/points', authorize(ROLES.ADMIN), validate(pointsRulesSchema), configController.setPointsRules);

export default router;
