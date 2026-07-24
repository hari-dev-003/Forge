import { auditRepo } from '../repositories/auditRepo.js';
import { asyncHandler, list } from '../lib/http.js';

export const auditController = {
  list: asyncHandler(async (req, res) => {
    const items = await auditRepo.list(req.query);
    list(res, items);
  }),
};

export default auditController;
