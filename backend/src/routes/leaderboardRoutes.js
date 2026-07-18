import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboardController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { leaderboardQuerySchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(leaderboardQuerySchema, 'query'), leaderboardController.board);
router.get('/me', leaderboardController.me);

export default router;
