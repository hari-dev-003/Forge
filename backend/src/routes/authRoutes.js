import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, completeNewPasswordSchema } from '../validators/schemas.js';

const router = Router();

// Sign-in is proxied to Cognito. Accounts are always admin/manager-provisioned
// (see /users) — there is no public self-signup. A Manager-created User gets a
// temporary password, so login() may return a NEW_PASSWORD_REQUIRED challenge
// instead of a token; complete-new-password finishes that first login.
router.post('/login', validate(loginSchema), authController.login);
router.post('/complete-new-password', validate(completeNewPasswordSchema), authController.completeNewPassword);
router.get('/me', authenticate, authController.me);

export default router;
