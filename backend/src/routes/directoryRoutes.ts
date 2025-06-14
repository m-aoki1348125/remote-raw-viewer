import { Router } from 'express';
import { directoryController } from '../controllers/directoryController';

const router = Router();

// Directory and file browsing routes
router.get('/directories', directoryController.listDirectory);
router.get('/images', directoryController.getImages);
router.get('/thumbnails', directoryController.getThumbnail);
router.get('/metadata', directoryController.getMetadata);

export default router;