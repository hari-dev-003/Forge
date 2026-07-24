import { configRepo } from '../repositories/configRepo.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { asyncHandler, ok } from '../lib/http.js';

export const configController = {
  getPointsRules: asyncHandler(async (_req, res) => {
    const rules = await configRepo.getPointsRules();
    ok(res, { rules });
  }),

  setPointsRules: asyncHandler(async (req, res) => {
    const before = await configRepo.getPointsRules();
    const rules = await configRepo.setPointsRules(req.body);
    await auditRepo.record({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'POINTS_RULES_UPDATED',
      target: 'CONFIG/POINTS_RULES',
      meta: { before, after: rules },
    });
    ok(res, { rules });
  }),
};

export default configController;
