export interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  isConnected: boolean;
  lastConnected?: Date;
}

export interface ConnectionFormData {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  privateKey: string;
  authMethod: 'password' | 'privateKey';
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
}