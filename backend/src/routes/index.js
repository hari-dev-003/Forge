import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import meetingRoutes from './meetingRoutes.js';
import approvalRoutes from './approvalRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import configRoutes from './configRoutes.js';
import auditRoutes from './auditRoutes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', ts: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/meetings', meetingRoutes);
router.use('/approvals', approvalRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/uploads', uploadRoutes);
router.use('/config', configRoutes);
router.use('/audit', auditRoutes);

export default router;
