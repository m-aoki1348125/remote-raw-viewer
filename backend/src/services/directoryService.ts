import { connectionService } from './connectionService';
import { logger } from '../utils/logger';

interface DirectoryItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: number;
  isImage?: boolean;  // Changed from is_image to isImage for consistency
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

    if (!connection.isConnected || !connectionService.isSSHConnected(connectionId)) {
      throw new Error(`Connection '${connection.name}' is not connected`);
    }

    try {
      const sshService = connectionService.getSSHService();
      const directoryListing = await sshService.listDirectory(connectionId, path);
      
      // Convert SSHService format to API format with consistent naming
      const items: DirectoryItem[] = directoryListing.items.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        modified: item.modified.getTime(),
        isImage: item.isImage,  // Changed from is_image to isImage for consistency
        extension: item.name.includes('.') ? item.name.split('.').pop() : undefined,
        permissions: undefined // TODO: Add permissions if needed
      }));

      logger.info(`Listed directory ${path} for connection ${connection.name}`);
      
      return {
        success: true,
        data: {
          path: directoryListing.path,
          items: items
        }
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
      item.type === 'file' && item.isImage === true
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

    if (!connection.isConnected || !connectionService.isSSHConnected(connectionId)) {
      throw new Error(`Connection '${connection.name}' is not connected`);
    }

    try {
      const sshService = connectionService.getSSHService();
      
      // Check if file is a RAW image
      const ext = imagePath.split('.').pop()?.toLowerCase() || '';
      if (ext === 'raw') {
        return this.generateRawImageThumbnail(connectionId, imagePath);
      }

      // For regular image files, get the file directly via SSH
      try {
        const thumbnailBase64 = await this.getImageFileAsBase64(connectionId, imagePath);
        
        const thumbnailData: ThumbnailResult = {
          success: true,
          thumbnail_base64: thumbnailBase64
        };

        if (!thumbnailBase64 || thumbnailBase64.length === 0) {
          logger.warn(`Empty thumbnail data for ${imagePath}`);
          throw new Error('Empty thumbnail data');
        }

        return {
          success: true,
          data: thumbnailData
        };
      } catch (imageError) {
        logger.warn(`Failed to get image data for ${imagePath}, falling back to placeholder: ${imageError.message}`);
        // Fall back to placeholder on any error
        throw imageError;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to generate thumbnail for ${imagePath} on ${connection.name}: ${message}`);
      
      // Fall back to placeholder on error
      const thumbnailData: ThumbnailResult = {
        success: true,
        thumbnail_base64: this.generatePlaceholderThumbnail(imagePath)
      };

      return {
        success: true,
        data: thumbnailData
      };
    }
  }

  private async getImageFileAsBase64(connectionId: string, imagePath: string): Promise<string> {
    const sshService = connectionService.getSSHService();
    
    // Use SSH to get the file content as base64
    const command = `base64 "${imagePath}" 2>/dev/null`;
    const ssh = sshService.getConnection(connectionId);
    
    if (!ssh) {
      throw new Error('SSH connection not found');
    }

    const result = await ssh.execCommand(command);
    
    if (result.code !== 0) {
      throw new Error(`Failed to read image file: ${result.stderr}`);
    }

    // Clean up the base64 output (remove newlines and whitespace)
    return result.stdout.replace(/\s/g, '');
  }

  private async generateRawImageThumbnail(connectionId: string, imagePath: string): Promise<{ success: boolean; data: ThumbnailResult }> {
    const sshService = connectionService.getSSHService();
    const ssh = sshService.getConnection(connectionId);
    
    if (!ssh) {
      throw new Error('SSH connection not found');
    }

    try {
      // Get file size to determine dimensions
      const statCommand = `stat -c%s "${imagePath}" 2>/dev/null`;
      const statResult = await ssh.execCommand(statCommand);
      
      if (statResult.code !== 0) {
        throw new Error(`Failed to get file size: ${statResult.stderr}`);
      }

      const fileSize = parseInt(statResult.stdout.trim());
      let width: number, height: number;

      // Determine dimensions based on file size
      if (fileSize === 327680) {
        // 640x512 grayscale
        width = 640;
        height = 512;
      } else {
        // Check if it's a perfect square
        const dimension = Math.sqrt(fileSize);
        if (Number.isInteger(dimension)) {
          width = height = dimension;
        } else {
          // Invalid RAW file size, return placeholder
          throw new Error(`Invalid RAW file size: ${fileSize}`);
        }
      }

      // Create a simple grayscale thumbnail using ImageMagick if available
      // First check if ImageMagick is available
      const magickCheckResult = await ssh.execCommand('which convert 2>/dev/null');
      
      if (magickCheckResult.code === 0) {
        // Use ImageMagick to convert RAW to thumbnail with uniform square output
        // This creates a 150x150 square thumbnail with gray background and centers the image
        const thumbnailCommand = `convert -depth 8 -size ${width}x${height} gray:"${imagePath}" -resize 150x150 -background gray -gravity center -extent 150x150 png:- | base64 2>/dev/null`;
        const thumbnailResult = await ssh.execCommand(thumbnailCommand);
        
        if (thumbnailResult.code === 0 && thumbnailResult.stdout.trim()) {
          return {
            success: true,
            data: {
              success: true,
              thumbnail_base64: thumbnailResult.stdout.replace(/\s/g, '')
            }
          };
        }
      }

      // Fallback: generate a placeholder with dimensions info
      const thumbnailData: ThumbnailResult = {
        success: true,
        thumbnail_base64: this.generateRawPlaceholder(imagePath, width, height)
      };

      return {
        success: true,
        data: thumbnailData
      };

    } catch (error) {
      // Return placeholder on error
      const thumbnailData: ThumbnailResult = {
        success: true,
        thumbnail_base64: this.generatePlaceholderThumbnail(imagePath)
      };

      return {
        success: true,
        data: thumbnailData
      };
    }
  }

  private generateRawPlaceholder(imagePath: string, width: number, height: number): string {
    // Create a specialized placeholder for RAW images with dimension info
    const svg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="150" height="150" fill="#FECA57"/>
      <text x="75" y="60" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
        RAW
      </text>
      <text x="75" y="80" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial" font-size="10">
        ${width}x${height}
      </text>
      <text x="75" y="95" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial" font-size="8">
        ${imagePath.split('/').pop()?.substring(0, 15) || ''}
      </text>
    </svg>`;
    
    return Buffer.from(svg).toString('base64');
  }

  private generatePlaceholderThumbnail(imagePath: string): string {
    // Generate a simple colored placeholder based on file extension
    const ext = imagePath.split('.').pop()?.toLowerCase() || '';
    const colors = {
      'jpg': '#FF6B6B',
      'jpeg': '#FF6B6B', 
      'png': '#4ECDC4',
      'gif': '#45B7D1',
      'webp': '#96CEB4',
      'raw': '#FECA57',
      'default': '#95A5A6'
    };
    
    const color = colors[ext] || colors.default;
    
    // Create a simple SVG placeholder
    const svg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="150" height="150" fill="${color}"/>
      <text x="75" y="75" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial" font-size="12">
        ${ext.toUpperCase()}
      </text>
      <text x="75" y="90" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial" font-size="8">
        ${imagePath.split('/').pop()?.substring(0, 15) || ''}
      </text>
    </svg>`;
    
    return Buffer.from(svg).toString('base64');
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