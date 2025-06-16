import { v4 as uuidv4 } from 'uuid';
import { SSHConnection, ConnectionFormData, ConnectionTestResult } from '../types/connection';
import { NodeSSH } from 'node-ssh';
import { logger } from '../utils/logger';
import { SSHService } from './SSHService';

class ConnectionService {
  private connections: Map<string, SSHConnection> = new Map();
  private sshClients: Map<string, NodeSSH> = new Map();
  private sshService: SSHService = new SSHService();

  getAllConnections(): SSHConnection[] {
    return Array.from(this.connections.values()).map(conn => ({
      ...conn,
      password: undefined, // Never return passwords
      privateKey: undefined // Never return private keys
    }));
  }

  getConnectionById(id: string): SSHConnection | null {
    const connection = this.connections.get(id);
    if (!connection) return null;
    
    return {
      ...connection,
      password: undefined, // Never return passwords
      privateKey: undefined // Never return private keys
    };
  }

  createConnection(data: ConnectionFormData): SSHConnection {
    // Check for duplicate names
    const existingConnection = Array.from(this.connections.values())
      .find(conn => conn.name === data.name);
    
    if (existingConnection) {
      throw new Error(`Connection with name '${data.name}' already exists`);
    }

    const connection: SSHConnection = {
      id: uuidv4(),
      name: data.name,
      host: data.host,
      port: data.port,
      username: data.username,
      password: data.authMethod === 'password' ? data.password : undefined,
      privateKey: data.authMethod === 'privateKey' ? data.privateKey : undefined,
      isConnected: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.connections.set(connection.id, connection);
    logger.info(`Created connection: ${connection.name} (${connection.id})`);

    return {
      ...connection,
      password: undefined, // Never return passwords
      privateKey: undefined // Never return private keys
    };
  }

  updateConnection(id: string, data: Partial<ConnectionFormData>): SSHConnection {
    const existingConnection = this.connections.get(id);
    if (!existingConnection) {
      throw new Error(`Connection with id '${id}' not found`);
    }

    // Check for duplicate names (excluding current connection)
    if (data.name && data.name !== existingConnection.name) {
      const duplicateConnection = Array.from(this.connections.values())
        .find(conn => conn.id !== id && conn.name === data.name);
      
      if (duplicateConnection) {
        throw new Error(`Connection with name '${data.name}' already exists`);
      }
    }

    const updatedConnection: SSHConnection = {
      ...existingConnection,
      ...data,
      password: data.authMethod === 'password' ? data.password : existingConnection.password,
      privateKey: data.authMethod === 'privateKey' ? data.privateKey : existingConnection.privateKey,
      updatedAt: new Date()
    };

    this.connections.set(id, updatedConnection);
    logger.info(`Updated connection: ${updatedConnection.name} (${id})`);

    return {
      ...updatedConnection,
      password: undefined, // Never return passwords
      privateKey: undefined // Never return private keys
    };
  }

  deleteConnection(id: string): void {
    const connection = this.connections.get(id);
    if (!connection) {
      throw new Error(`Connection with id '${id}' not found`);
    }

    // Disconnect if connected
    if (connection.isConnected) {
      this.disconnectSSH(id);
    }

    this.connections.delete(id);
    logger.info(`Deleted connection: ${connection.name} (${id})`);
  }

  async testConnection(id: string): Promise<ConnectionTestResult> {
    const connection = this.connections.get(id);
    if (!connection) {
      throw new Error(`Connection with id '${id}' not found`);
    }

    return this.testConnectionDirect({
      name: connection.name,
      host: connection.host,
      port: connection.port,
      username: connection.username,
      password: connection.password || '',
      privateKey: connection.privateKey || '',
      authMethod: connection.password ? 'password' : 'privateKey'
    });
  }

  async testConnectionDirect(data: ConnectionFormData): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const config = {
        host: data.host,
        port: data.port,
        username: data.username,
        password: data.authMethod === 'password' ? data.password || '' : ''
      };

      const success = await this.sshService.testConnection(config);
      const latency = Date.now() - startTime;
      
      if (success) {
        logger.info(`Connection test successful for ${data.host}:${data.port}: ${latency}ms`);
        return {
          success: true,
          message: `Connection successful to ${data.host}:${data.port}`,
          latency
        };
      } else {
        logger.warn(`Connection test failed for ${data.host}:${data.port}`);
        return {
          success: false,
          message: `Connection failed to ${data.host}:${data.port}`,
          latency
        };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      logger.warn(`Connection test failed for ${data.host}:${data.port}: ${message}`);
      
      return {
        success: false,
        message: `Connection failed: ${message}`,
        latency
      };
    }
  }

  async connectSSH(id: string): Promise<SSHConnection> {
    const connection = this.connections.get(id);
    if (!connection) {
      throw new Error(`Connection with id '${id}' not found`);
    }

    if (connection.isConnected) {
      return this.getConnectionById(id)!;
    }

    try {
      const config = {
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password || ''
      };

      await this.sshService.connect(id, config);
      
      // Update connection status
      const updatedConnection = {
        ...connection,
        isConnected: true,
        lastConnected: new Date()
      };
      
      this.connections.set(id, updatedConnection);
      
      logger.info(`SSH connection established for ${connection.name}`);
      
      return {
        ...updatedConnection,
        password: undefined,
        privateKey: undefined
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`SSH connection failed for ${connection.name}: ${message}`);
      throw new Error(`SSH connection failed: ${message}`);
    }
  }

  async disconnectSSH(id: string): Promise<SSHConnection> {
    const connection = this.connections.get(id);
    if (!connection) {
      throw new Error(`Connection with id '${id}' not found`);
    }

    try {
      await this.sshService.disconnect(id);
    } catch (error) {
      logger.warn(`Error disconnecting SSH for ${connection.name}: ${error}`);
    }

    const updatedConnection = {
      ...connection,
      isConnected: false
    };
    
    this.connections.set(id, updatedConnection);
    
    logger.info(`SSH connection closed for ${connection.name}`);
    
    return {
      ...updatedConnection,
      password: undefined,
      privateKey: undefined
    };
  }

  getSSHService(): SSHService {
    return this.sshService;
  }

  getSSHClient(id: string): NodeSSH | null {
    return this.sshService.getClient(id);
  }

  isSSHConnected(id: string): boolean {
    return this.sshService.isConnected(id);
  }
}

export const connectionService = new ConnectionService();