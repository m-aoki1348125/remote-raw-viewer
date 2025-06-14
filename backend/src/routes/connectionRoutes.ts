import { Router } from 'express';
import { connectionController } from '../controllers/connectionController';

const router = Router();

// Connection CRUD routes
router.get('/connections', connectionController.getAllConnections);
router.get('/connections/:id', connectionController.getConnectionById);
router.post('/connections', connectionController.createConnection);
router.put('/connections/:id', connectionController.updateConnection);
router.delete('/connections/:id', connectionController.deleteConnection);

// Connection operation routes
router.post('/connections/:id/test', connectionController.testConnection);
router.post('/connections/:id/connect', connectionController.connectSSH);
router.post('/connections/:id/disconnect', connectionController.disconnectSSH);

export default router;