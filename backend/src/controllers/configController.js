import { configRepo } from '../repositories/configRepo.js';
import { asyncHandler, ok } from '../lib/http.js';

export const configController = {
  getPointsRules: asyncHandler(async (_req, res) => {
    const rules = await configRepo.getPointsRules();
    ok(res, { rules });
  }),

  setPointsRules: asyncHandler(async (req, res) => {
    const rules = await configRepo.setPointsRules(req.body);
    ok(res, { rules });
  }),
};

export default configController;
