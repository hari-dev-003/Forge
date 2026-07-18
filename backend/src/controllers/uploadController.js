import { uploadService } from '../services/uploadService.js';
import { asyncHandler, ok } from '../lib/http.js';

export const uploadController = {
  presign: asyncHandler(async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const target = await uploadService.presign(req.body, baseUrl);
    ok(res, target);
  }),
};

export default uploadController;
