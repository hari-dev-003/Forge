import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, signupSchema, confirmSignupSchema, resendSignupCodeSchema } from '../validators/schemas.js';

const router = Router();

// Sign-in is proxied to Cognito. Manager provisioning is admin-only (see /users).
// Self-signup is always a field user, verified via Cognito's own emailed code
// (signup -> confirm-signup activates the account; resend-signup-code covers a
// lost/expired code) — no admin approval step.
router.post('/login', validate(loginSchema), authController.login);
router.post('/signup', validate(signupSchema), authController.signup);
router.post('/confirm-signup', validate(confirmSignupSchema), authController.confirmSignup);
router.post('/resend-signup-code', validate(resendSignupCodeSchema), authController.resendSignupCode);
router.get('/me', authenticate, authController.me);

export default router;
