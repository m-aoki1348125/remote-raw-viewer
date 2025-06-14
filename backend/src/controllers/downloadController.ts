import { Request, Response } from 'express';
import { connectionService } from '../services/connectionService';
import { logger } from '../utils/logger';
import path from 'path';
import archiver from 'archiver';

export const downloadController = {
  // GET /api/download/single?connectionId=xxx&filePath=xxx
  downloadSingle: async (req: Request, res: Response) => {
    try {
      const { connectionId, filePath } = req.query;
      
      if (!connectionId || !filePath) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: connectionId and filePath'
        });
      }

      const connection = connectionService.getConnectionById(connectionId as string);
      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Connection not found'
        });
      }

      if (!connection.isConnected) {
        return res.status(400).json({
          success: false,
          error: 'Connection is not active'
        });
      }

      const sshClient = connectionService.getSSHClient(connectionId as string);
      if (!sshClient) {
        return res.status(400).json({
          success: false,
          error: 'No active SSH connection'
        });
      }

      // Get file via SFTP
      const fileName = path.basename(filePath as string);
      
      // Use execCommand to cat the file and pipe to response
      const result = await sshClient.execCommand(`cat "${filePath}"`);
      
      if (result.code !== 0) {
        return res.status(404).json({
          success: false,
          error: 'File not found or cannot be read'
        });
      }
      
      // Set response headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Send file content
      res.send(Buffer.from(result.stdout, 'binary'));
      
      logger.info(`Downloaded file ${filePath} from ${connection.name}`);
      
    } catch (error) {
      logger.error('Error downloading file:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to download file'
        });
      }
    }
  },

  // POST /api/download/multiple
  downloadMultiple: async (req: Request, res: Response) => {
    try {
      const { connectionId, filePaths } = req.body;
      
      if (!connectionId || !Array.isArray(filePaths) || filePaths.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: connectionId and filePaths array'
        });
      }

      const connection = connectionService.getConnectionById(connectionId);
      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Connection not found'
        });
      }

      if (!connection.isConnected) {
        return res.status(400).json({
          success: false,
          error: 'Connection is not active'
        });
      }

      const sshClient = connectionService.getSSHClient(connectionId);
      if (!sshClient) {
        return res.status(400).json({
          success: false,
          error: 'No active SSH connection'
        });
      }

      // Set response headers for ZIP download
      const zipFileName = `images_${Date.now()}.zip`;
      res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
      res.setHeader('Content-Type', 'application/zip');
      
      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Pipe archive to response
      archive.pipe(res);

      // Add files to archive
      for (const filePath of filePaths) {
        try {
          const fileName = path.basename(filePath);
          const result = await sshClient.execCommand(`cat "${filePath}"`);
          
          if (result.code === 0) {
            archive.append(Buffer.from(result.stdout, 'binary'), { name: fileName });
          } else {
            logger.warn(`Failed to read file ${filePath}: ${result.stderr}`);
          }
        } catch (fileError) {
          logger.warn(`Failed to add file ${filePath} to archive:`, fileError);
          // Continue with other files
        }
      }

      // Finalize the archive
      await archive.finalize();
      
      logger.info(`Downloaded ${filePaths.length} files as ZIP from ${connection.name}`);
      
    } catch (error) {
      logger.error('Error downloading multiple files:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to create download archive'
        });
      }
    }
  }
};