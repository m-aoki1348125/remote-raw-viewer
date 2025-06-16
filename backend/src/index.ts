import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import connectionRoutes from './routes/connectionRoutes';
import directoryRoutes from './routes/directoryRoutes';
import downloadRoutes from './routes/downloadRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || true; // Allow all origins in development

// Middleware
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// API routes
app.use('/api', connectionRoutes);
app.use('/api', directoryRoutes);
app.use('/api', downloadRoutes);

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Backend server is running on port ${PORT}`);
  });
}

export default app;