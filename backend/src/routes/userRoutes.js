import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/schemas.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate);

router.post('/', authorize(ROLES.ADMIN), validate(createUserSchema), userController.create);
router.get('/', authorize(ROLES.ADMIN, ROLES.MANAGER), userController.list);
router.get('/managers', authorize(ROLES.ADMIN), userController.managers);
router.patch('/:id', authorize(ROLES.ADMIN), validate(updateUserSchema), userController.update);

export default router;
