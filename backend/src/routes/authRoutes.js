import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, signupSchema } from '../validators/schemas.js';

const router = Router();

// Sign-in is proxied to Cognito. Admin/Manager provisioning is admin-only (see /users);
// self-signup here always creates an inactive Employee pending admin approval.
router.post('/login', validate(loginSchema), authController.login);
router.post('/signup', validate(signupSchema), authController.signup);
router.get('/me', authenticate, authController.me);

export default router;
