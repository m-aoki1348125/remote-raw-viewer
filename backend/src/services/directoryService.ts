import { connectionService } from './connectionService';
import { logger } from '../utils/logger';

interface DirectoryItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: number;
  is_image?: boolean;
  extension?: string;
  permissions?: string;
}

interface DirectoryListing {
  path: string;
  items: DirectoryItem[];
}

interface ImageListing {
  path: string;
  images: DirectoryItem[];
}

interface ThumbnailResult {
  success: boolean;
  thumbnail_base64?: string;
  error?: string;
}

class DirectoryService {
  
  async listDirectory(connectionId: string, path: string): Promise<{ success: boolean; data: DirectoryListing }> {
    const connection = connectionService.getConnectionById(connectionId);
    if (!connection) {
      throw new Error(`Connection with id '${connectionId}' not found`);
    }

    if (!connection.isConnected) {
      throw new Error(`Connection '${connection.name}' is not connected`);
    }

    const sshClient = connectionService.getSSHClient(connectionId);
    if (!sshClient) {
      throw new Error(`No active SSH connection for '${connection.name}'`);
    }

    try {
      // Execute agent script on remote server
      const agentCommand = `cd /home/${connection.username}/agent && PYTHONPATH=src python3 src/main.py list --path "${path}"`;

      const result = await sshClient.execCommand(agentCommand);
      
      if (result.code !== 0) {
        throw new Error(`Agent command failed: ${result.stderr}`);
      }

      let data;
      try {
        data = JSON.parse(result.stdout);
      } catch (parseError) {
        throw new Error(`Failed to parse agent response: ${result.stdout}`);
      }

      logger.info(`Listed directory ${path} for connection ${connection.name}`);
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to list directory ${path} for ${connection.name}: ${message}`);
      throw error;
    }
  }

  async getImageFiles(connectionId: string, path: string): Promise<{ success: boolean; data: ImageListing }> {
    const directoryResult = await this.listDirectory(connectionId, path);
    
    // Filter for image files
    const images = directoryResult.data.items.filter(item => 
      item.type === 'file' && item.is_image === true
    );

    return {
      success: true,
      data: {
        path: directoryResult.data.path,
        images: images
      }
    };
  }

  async generateThumbnail(connectionId: string, imagePath: string): Promise<{ success: boolean; data: ThumbnailResult }> {
    const connection = connectionService.getConnectionById(connectionId);
    if (!connection) {
      throw new Error(`Connection with id '${connectionId}' not found`);
    }

    if (!connection.isConnected) {
      throw new Error(`Connection '${connection.name}' is not connected`);
    }

    const sshClient = connectionService.getSSHClient(connectionId);
    if (!sshClient) {
      throw new Error(`No active SSH connection for '${connection.name}'`);
    }

    try {
      // Execute agent script on remote server
      const agentCommand = `cd /home/${connection.username}/agent && PYTHONPATH=src python3 src/main.py thumbnail --path "${imagePath}"`;

      const result = await sshClient.execCommand(agentCommand);
      
      if (result.code !== 0) {
        throw new Error(`Agent command failed: ${result.stderr}`);
      }

      let data;
      try {
        data = JSON.parse(result.stdout);
      } catch (parseError) {
        throw new Error(`Failed to parse agent response: ${result.stdout}`);
      }

      logger.info(`Generated thumbnail for ${imagePath} on ${connection.name}`);
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to generate thumbnail for ${imagePath} on ${connection.name}: ${message}`);
      throw error;
    }
  }

  async getMetadata(connectionId: string, filePath: string): Promise<{ success: boolean; data: any }> {
    const connection = connectionService.getConnectionById(connectionId);
    if (!connection) {
      throw new Error(`Connection with id '${connectionId}' not found`);
    }

    if (!connection.isConnected) {
      throw new Error(`Connection '${connection.name}' is not connected`);
    }

    const sshClient = connectionService.getSSHClient(connectionId);
    if (!sshClient) {
      throw new Error(`No active SSH connection for '${connection.name}'`);
    }

    try {
      // Execute agent script to get metadata
      const agentCommand = `python3 -c "
import sys
import os
sys.path.append('/app/src')
from main import execute_command
result = execute_command('metadata', '${filePath}')
print(result)
"`;

      const result = await sshClient.execCommand(agentCommand);
      
      if (result.code !== 0) {
        throw new Error(`Agent command failed: ${result.stderr}`);
      }

      let data;
      try {
        data = JSON.parse(result.stdout);
      } catch (parseError) {
        throw new Error(`Failed to parse agent response: ${result.stdout}`);
      }

      logger.info(`Got metadata for ${filePath} on ${connection.name}`);
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to get metadata for ${filePath} on ${connection.name}: ${message}`);
      throw error;
    }
  }
}

export const directoryService = new DirectoryService();