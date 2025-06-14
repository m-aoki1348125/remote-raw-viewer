import { Router } from 'express';
import { downloadController } from '../controllers/downloadController';

const router = Router();

// Download routes
router.get('/download/single', downloadController.downloadSingle);
router.post('/download/multiple', downloadController.downloadMultiple);

export default router;