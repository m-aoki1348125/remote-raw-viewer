import { Request, Response } from 'express';
import { connectionService } from '../services/connectionService';
import { ConnectionFormData } from '../types/connection';
import { logger } from '../utils/logger';

export const connectionController = {
  // GET /api/connections
  getAllConnections: (req: Request, res: Response) => {
    try {
      const connections = connectionService.getAllConnections();
      res.json({
        success: true,
        data: connections
      });
    } catch (error) {
      logger.error('Error getting connections:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // GET /api/connections/:id
  getConnectionById: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const connection = connectionService.getConnectionById(id);
      
      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Connection not found'
        });
      }

      res.json({
        success: true,
        data: connection
      });
    } catch (error) {
      logger.error('Error getting connection:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // POST /api/connections
  createConnection: (req: Request, res: Response) => {
    try {
      const data: ConnectionFormData = req.body;
      
      // Validate required fields
      const requiredFields = ['name', 'host', 'username', 'authMethod'];
      const missingFields = requiredFields.filter(field => !data[field as keyof ConnectionFormData]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Validate authentication method requirements
      if (data.authMethod === 'password' && !data.password) {
        return res.status(400).json({
          success: false,
          error: 'Password is required when using password authentication'
        });
      }

      if (data.authMethod === 'privateKey' && !data.privateKey) {
        return res.status(400).json({
          success: false,
          error: 'Private key is required when using private key authentication'
        });
      }

      // Set default port if not provided
      if (!data.port) {
        data.port = 22;
      }

      const connection = connectionService.createConnection(data);
      
      res.status(201).json({
        success: true,
        data: connection
      });
    } catch (error) {
      logger.error('Error creating connection:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return res.status(409).json({
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

  // PUT /api/connections/:id
  updateConnection: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: Partial<ConnectionFormData> = req.body;

      const connection = connectionService.updateConnection(id, data);
      
      res.json({
        success: true,
        data: connection
      });
    } catch (error) {
      logger.error('Error updating connection:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error instanceof Error && error.message.includes('already exists')) {
        return res.status(409).json({
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

  // DELETE /api/connections/:id
  deleteConnection: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      connectionService.deleteConnection(id);
      
      res.json({
        success: true,
        message: 'Connection deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting connection:', error);
      
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

  // POST /api/connections/:id/test
  testConnection: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await connectionService.testConnection(id);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error testing connection:', error);
      
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

  // POST /api/connections/test-direct
  testConnectionDirect: async (req: Request, res: Response) => {
    try {
      const data: ConnectionFormData = req.body;
      
      const result = await connectionService.testConnectionDirect(data);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error testing connection directly:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // POST /api/connections/:id/connect
  connectSSH: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const connection = await connectionService.connectSSH(id);
      
      res.json({
        success: true,
        data: connection
      });
    } catch (error) {
      logger.error('Error connecting SSH:', error);
      
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

  // POST /api/connections/:id/disconnect
  disconnectSSH: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const connection = await connectionService.disconnectSSH(id);
      
      res.json({
        success: true,
        data: connection
      });
    } catch (error) {
      logger.error('Error disconnecting SSH:', error);
      
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