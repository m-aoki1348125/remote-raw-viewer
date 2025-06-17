import { NodeSSH } from 'node-ssh';
import path from 'path';
import fs from 'fs/promises';

export interface SSHConnectionConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  path: string;
  isImage?: boolean;
  isRawImage?: boolean;
  rawDimensions?: { width: number; height: number };
}

export interface DirectoryListing {
  path: string;
  items: FileItem[];
  parentPath?: string;
}

export class SSHService {
  private connections: Map<string, NodeSSH> = new Map();

  // Test SSH connection
  async testConnection(config: SSHConnectionConfig): Promise<boolean> {
    const ssh = new NodeSSH();
    try {
      await ssh.connect(config);
      await ssh.execCommand('echo "test"');
      ssh.dispose();
      return true;
    } catch (error) {
      console.error('SSH connection test failed:', error);
      return false;
    }
  }

  // Establish SSH connection
  async connect(connectionId: string, config: SSHConnectionConfig): Promise<void> {
    if (this.connections.has(connectionId)) {
      await this.disconnect(connectionId);
    }

    const ssh = new NodeSSH();
    try {
      await ssh.connect(config);
      this.connections.set(connectionId, ssh);
      console.log(`SSH connection established: ${connectionId}`);
    } catch (error) {
      console.error(`SSH connection failed for ${connectionId}:`, error);
      throw new Error(`Failed to connect to SSH server: ${error.message}`);
    }
  }

  // Disconnect SSH
  async disconnect(connectionId: string): Promise<void> {
    const ssh = this.connections.get(connectionId);
    if (ssh) {
      ssh.dispose();
      this.connections.delete(connectionId);
      console.log(`SSH connection closed: ${connectionId}`);
    }
  }

  // Check if connection exists
  isConnected(connectionId: string): boolean {
    return this.connections.has(connectionId);
  }

  // Get SSH connection for direct access
  getConnection(connectionId: string): NodeSSH | undefined {
    return this.connections.get(connectionId);
  }

  // List directory contents
  async listDirectory(connectionId: string, remotePath: string = '~'): Promise<DirectoryListing> {
    const ssh = this.connections.get(connectionId);
    if (!ssh) {
      throw new Error('SSH connection not found');
    }

    try {
      // Normalize path
      let actualPath = remotePath;
      if (remotePath === '~' || remotePath === '') {
        const homeResult = await ssh.execCommand('echo $HOME');
        actualPath = homeResult.stdout.trim();
      }

      // Get directory listing with detailed information
      const command = `ls -la "${actualPath}" 2>/dev/null`;
      const result = await ssh.execCommand(command);

      if (result.code !== 0) {
        throw new Error(`Failed to list directory: ${result.stderr || 'Unknown error'}`);
      }

      const items: FileItem[] = [];
      const lines = result.stdout.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const parsed = this.parseFileEntry(line, actualPath);
        if (parsed && parsed.name !== '.' && parsed.name !== '..') {
          items.push(parsed);
        }
      }

      // Get parent directory path
      const parentPath = actualPath === '/' ? undefined : path.dirname(actualPath);

      return {
        path: actualPath,
        items: items.sort((a, b) => {
          // Directories first, then files
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        }),
        parentPath
      };
    } catch (error) {
      console.error('Error listing directory:', error);
      throw new Error(`Failed to list directory: ${error.message}`);
    }
  }

  // Parse file entry from ls -la output
  private parseFileEntry(line: string, basePath: string): FileItem | null {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) return null;

    const permissions = parts[0];
    const size = parseInt(parts[4], 10) || 0;
    const month = parts[5];
    const day = parts[6];
    const timeOrYear = parts[7];
    const name = parts.slice(8).join(' ');

    // Skip current and parent directory entries
    if (name === '.' || name === '..') return null;

    const type = permissions.startsWith('d') ? 'directory' : 'file';
    const fullPath = path.posix.join(basePath, name);

    // Parse date
    const currentYear = new Date().getFullYear();
    let modified: Date;
    
    if (timeOrYear.includes(':')) {
      // Current year, time format (e.g., "14:30")
      modified = new Date(`${month} ${day}, ${currentYear} ${timeOrYear}`);
    } else {
      // Different year (e.g., "2023")
      modified = new Date(`${month} ${day}, ${timeOrYear}`);
    }

    // Check if file is an image
    const isImage = this.isImageFile(name);
    const isRawImage = this.isRawImageFile(name);
    let rawDimensions: { width: number; height: number } | undefined;

    // Determine RAW image dimensions based on file size
    if (isRawImage && type === 'file') {
      rawDimensions = this.getRawImageDimensions(size);
    }

    return {
      name,
      type,
      size,
      modified,
      path: fullPath,
      isImage,
      isRawImage,
      rawDimensions
    };
  }

  // Check if file is an image
  private isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.raw'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  // Check if file is a RAW image
  private isRawImageFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ext === '.raw';
  }

  // Get RAW image dimensions based on file size
  private getRawImageDimensions(fileSize: number): { width: number; height: number } | undefined {
    // Special case: 327,680 bytes = 640x512 grayscale
    if (fileSize === 327680) {
      return { width: 640, height: 512 };
    }

    // Check if it's a perfect square
    const sqrt = Math.sqrt(fileSize);
    if (Number.isInteger(sqrt)) {
      return { width: sqrt, height: sqrt };
    }

    return undefined;
  }

  // Execute command on remote server
  async executeCommand(connectionId: string, command: string): Promise<{ stdout: string; stderr: string; code: number }> {
    const ssh = this.connections.get(connectionId);
    if (!ssh) {
      throw new Error('SSH connection not found');
    }

    try {
      const result = await ssh.execCommand(command);
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.code || 0
      };
    } catch (error) {
      console.error('Error executing command:', error);
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  // Get file content (for small files)
  async getFileContent(connectionId: string, remotePath: string): Promise<Buffer> {
    const ssh = this.connections.get(connectionId);
    if (!ssh) {
      throw new Error('SSH connection not found');
    }

    try {
      // Use cat command to get file content
      const result = await ssh.execCommand(`cat "${remotePath}"`);
      if (result.code !== 0) {
        throw new Error(`Failed to read file: ${result.stderr}`);
      }
      return Buffer.from(result.stdout, 'binary');
    } catch (error) {
      console.error('Error reading file:', error);
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  // Get SSH client for a connection
  getClient(connectionId: string): NodeSSH | null {
    return this.connections.get(connectionId) || null;
  }

  // Check if connection is active
  isConnected(connectionId: string): boolean {
    const ssh = this.connections.get(connectionId);
    return ssh ? ssh.isConnected() : false;
  }

  // Cleanup all connections
  dispose(): void {
    for (const [connectionId, ssh] of this.connections) {
      ssh.dispose();
    }
    this.connections.clear();
  }
}