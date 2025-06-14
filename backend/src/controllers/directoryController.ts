import { Request, Response } from 'express';
import { directoryService } from '../services/directoryService';
import { logger } from '../utils/logger';

export const directoryController = {
  // GET /api/directories?connectionId=xxx&path=xxx
  listDirectory: async (req: Request, res: Response) => {
    try {
      const { connectionId, path } = req.query;
      
      if (!connectionId || !path) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: connectionId and path'
        });
      }

      const result = await directoryService.listDirectory(
        connectionId as string, 
        path as string
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error listing directory:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error instanceof Error && error.message.includes('not connected')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // GET /api/images?connectionId=xxx&path=xxx
  getImages: async (req: Request, res: Response) => {
    try {
      const { connectionId, path } = req.query;
      
      if (!connectionId || !path) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: connectionId and path'
        });
      }

      const result = await directoryService.getImageFiles(
        connectionId as string, 
        path as string
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error getting images:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // GET /api/thumbnails?connectionId=xxx&imagePath=xxx
  getThumbnail: async (req: Request, res: Response) => {
    try {
      const { connectionId, imagePath } = req.query;
      
      if (!connectionId || !imagePath) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: connectionId and imagePath'
        });
      }

      const result = await directoryService.generateThumbnail(
        connectionId as string, 
        imagePath as string
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // GET /api/metadata?connectionId=xxx&filePath=xxx
  getMetadata: async (req: Request, res: Response) => {
    try {
      const { connectionId, filePath } = req.query;
      
      if (!connectionId || !filePath) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: connectionId and filePath'
        });
      }

      const result = await directoryService.getMetadata(
        connectionId as string, 
        filePath as string
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error getting metadata:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};