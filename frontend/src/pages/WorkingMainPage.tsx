import React, { useState, useEffect, useCallback } from 'react';
import { connectionApi, directoryApi } from '../services/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';
import { useKeyboardShortcuts, createCommonShortcuts } from '../hooks/useKeyboardShortcuts';
import HelpModal from '../components/ui/HelpModal';
import StatusIndicator from '../components/ui/StatusIndicator';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PerformanceDashboard from '../components/ui/PerformanceDashboard';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import ImageGallery from '../components/ImageGallery';
import DirectoryTree from '../components/DirectoryTree';
import ImageModal from '../components/ImageModal';
import ConnectionForm from '../components/ConnectionForm';
import { DirectoryItem } from '../types/directory';
import { ConnectionFormData } from '../types/connection';

interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  isConnected: boolean;
  lastConnected?: Date;
}

const WorkingMainPage: React.FC = () => {
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [browsingConnection, setBrowsingConnection] = useState<SSHConnection | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('~');
  const [directoryItems, setDirectoryItems] = useState<any[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [selectedImage, setSelectedImage] = useState<DirectoryItem | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const { 
    toasts, 
    removeToast, 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo 
  } = useToast();

  const { 
    trackApiCall, 
    trackError, 
    updateConnectionCount 
  } = usePerformanceMonitor();

  useEffect(() => {
    loadConnections();
  }, []);

  // System status monitoring
  useEffect(() => {
    const connectedCount = connections.filter(c => c.isConnected).length;
    const totalCount = connections.length;
    
    // Update performance monitor
    updateConnectionCount(connectedCount);
    
    if (error) {
      setSystemStatus('error');
      trackError(error);
    } else if (totalCount > 0 && connectedCount === 0) {
      setSystemStatus('warning');
    } else {
      setSystemStatus('healthy');
    }
  }, [connections, error, updateConnectionCount, trackError]);

  const loadConnections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Track API call performance
      const startTime = performance.now();
      const connectionList = await connectionApi.getAll();
      const endTime = performance.now();
      trackApiCall(endTime - startTime);
      setConnections(connectionList);
      
      // Display loaded connections status
      if (connectionList.length === 0) {
        showInfo('No connections', 'No saved connections found. You can add one using the form.');
      } else {
        showSuccess('Connections loaded', `Found ${connectionList.length} saved connection(s)`);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      setError('API connection failed, using sample data');
      showWarning('API Connection Failed', 'Using sample data for demonstration');
      
      // Use mock data for demonstration
      setConnections([
        {
          id: 'sample-1',
          name: 'Test Server',
          host: 'localhost',
          port: 22,
          username: 'testuser',
          isConnected: false
        },
        {
          id: 'sample-2',
          name: 'Demo Server',
          host: 'demo.example.com',
          port: 22,
          username: 'demo',
          isConnected: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = useCallback(async (id: string) => {
    setIsLoading(true);
    const connection = connections.find(c => c.id === id);
    
    try {
      console.log('Connecting to:', id);
      showInfo('Connecting...', `Establishing connection to ${connection?.name}`);
      
      // Use connectionApi
      const result = await connectionApi.connect(id);
      setConnections(prev => prev.map(conn => 
        conn.id === id 
          ? { ...conn, isConnected: true, lastConnected: new Date() }
          : conn
      ));
      showSuccess('Connected!', `Successfully connected to ${connection?.name}`);
    } catch (error) {
      console.error('Error connecting:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to connect: ${message}`);
      showError('Connection Failed', `Could not connect to ${connection?.name}: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [connections, showInfo, showSuccess, showError]);

  const handleDisconnect = useCallback(async (id: string) => {
    setIsLoading(true);
    const connection = connections.find(c => c.id === id);
    
    try {
      console.log('Disconnecting from:', id);
      
      // Use connectionApi
      const result = await connectionApi.disconnect(id);
      setConnections(prev => prev.map(conn => 
        conn.id === id 
          ? { ...conn, isConnected: false }
          : conn
      ));
      showInfo('Disconnected', `Disconnected from ${connection?.name}`);
    } catch (error) {
      console.error('Error disconnecting:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to disconnect: ${message}`);
      showError('Disconnection Failed', `Could not disconnect from ${connection?.name}: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [connections, showInfo, showError]);

  const handleCreateConnection = async (connectionData: ConnectionFormData) => {
    try {
      showInfo('Creating Connection...', `Setting up connection to ${connectionData.host}`);
      
      // Create the connection via API
      const response = await connectionApi.create(connectionData);
      
      // Add to local state
      const newConnection: SSHConnection = {
        id: response.id,
        name: connectionData.name,
        host: connectionData.host,
        port: connectionData.port,
        username: connectionData.username,
        isConnected: false
      };
      
      setConnections(prev => [...prev, newConnection]);
      setShowConnectionForm(false);
      showSuccess('Connection Created', `Connection "${connectionData.name}" has been saved successfully`);
    } catch (error) {
      console.error('Error creating connection:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      showError('Connection Creation Failed', `Could not create connection: ${message}`);
    }
  };

  // Handle browse button click
  const handleBrowse = useCallback(async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection || !connection.isConnected) {
      showError('Browse Failed', 'Connection not established');
      return;
    }

    try {
      setSelectedConnection(connectionId);
      showInfo('Opening Browser', `Loading directory structure for ${connection.name}...`);
      
      // Use directoryApi
      const result = await directoryApi.list(connectionId, '~');
      setBrowsingConnection(connection);
      setCurrentPath(result.path);
      setDirectoryItems(result.items);
      setSelectedConnection(null);
      showSuccess('Browse Ready', `Now browsing ${connection.name}`);
      
    } catch (error) {
      console.error('Error browsing connection:', error);
      showError('Browse Failed', `Could not browse ${connection?.name}`);
      setSelectedConnection(null);
    }
  }, [connections, showInfo, showSuccess, showError]);

  // Handle directory navigation
  const handleDirectoryNavigation = useCallback(async (path: string) => {
    if (!browsingConnection) return;

    try {
      setLoadingDirectory(true);
      
      // Use directoryApi
      const result = await directoryApi.list(browsingConnection.id, path);
      setCurrentPath(result.path);
      setDirectoryItems(result.items);
    } catch (error) {
      console.error('Error navigating directory:', error);
      showError('Navigation Failed', `Could not access directory: ${path}`);
    } finally {
      setLoadingDirectory(false);
    }
  }, [browsingConnection, showInfo, showError]);

  // Handle image selection
  const handleImageSelect = useCallback((image: DirectoryItem) => {
    setSelectedImage(image);
    setShowImageModal(true);
  }, []);

  // Handle image modal close
  const handleCloseImageModal = useCallback(() => {
    setShowImageModal(false);
    setSelectedImage(null);
  }, []);

  // Filter connections based on search query
  const filteredConnections = connections.filter(connection => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      connection.name.toLowerCase().includes(query) ||
      connection.host.toLowerCase().includes(query) ||
      connection.username.toLowerCase().includes(query) ||
      `${connection.username}@${connection.host}:${connection.port}`.toLowerCase().includes(query)
    );
  });

  // Define keyboard shortcuts
  const shortcuts = createCommonShortcuts({
    refresh: () => {
      loadConnections();
      showInfo('Refreshing...', 'Reloading connection list');
    },
    addConnection: () => {
      setShowConnectionForm(true);
      showInfo('Add Connection', 'Connection form opened');
    },
    escape: () => {
      if (browsingConnection) {
        setBrowsingConnection(null);
        setCurrentPath('~');
        setDirectoryItems([]);
        showInfo('Browse Closed', 'Returned to connection list');
      } else if (showConnectionForm) {
        setShowConnectionForm(false);
      } else if (showHelpModal) {
        setShowHelpModal(false);
      }
    },
    help: () => {
      setShowHelpModal(true);
    },
    search: () => {
      setShowSearch(true);
      setTimeout(() => {
        const searchInput = document.getElementById('connection-search');
        if (searchInput) searchInput.focus();
      }, 100);
    }
  });

  // Register keyboard shortcuts
  useKeyboardShortcuts(shortcuts);

  // If browsing, show directory browser instead
  if (browsingConnection) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Toast Container */}
        <ToastContainer 
          toasts={toasts} 
          onRemoveToast={removeToast}
          position="bottom-right"
        />
        
        {/* Browsing Header */}
        <header className="bg-white shadow-sm border-b flex-shrink-0">
          <div className="w-full px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setBrowsingConnection(null);
                    setCurrentPath('~');
                    setDirectoryItems([]);
                  }}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  ← Back to Connections
                </button>
                <h1 className="text-xl font-bold text-gray-900">
                  📁 Browsing: {browsingConnection.name}
                </h1>
                <StatusIndicator
                  status="online"
                  label={`${browsingConnection.username}@${browsingConnection.host}:${browsingConnection.port}`}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Directory Browser Content */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex w-full h-full">
            {/* Directory Tree Sidebar */}
            <div className="w-80 lg:w-96 xl:w-80 flex-shrink-0 border-r border-gray-200 bg-white h-full overflow-hidden hidden md:block">
              <div className="h-full p-4">
                <DirectoryTree
                  connectionId={browsingConnection.id}
                  currentPath={currentPath}
                  onPathChange={handleDirectoryNavigation}
                />
              </div>
            </div>
            
            {/* Image Gallery Main Area */}
            <div className="flex-1 h-full overflow-hidden">
              <div className="h-full p-4">
                <ImageGallery
                  connectionId={browsingConnection.id}
                  currentPath={currentPath}
                  onImageSelect={handleImageSelect}
                  onPathChange={handleDirectoryNavigation}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <ImageModal
            image={selectedImage}
            isOpen={showImageModal}
            onClose={handleCloseImageModal}
            connectionId={browsingConnection.id}
          />
        )}

        {/* Help Modal */}
        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          shortcuts={shortcuts}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Container */}
      <ToastContainer 
        toasts={toasts} 
        onRemoveToast={removeToast}
        position="bottom-right"
      />
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-gray-900">
                Remote Raw Viewer
              </h1>
              <StatusIndicator
                status={systemStatus === 'healthy' ? 'online' : systemStatus === 'warning' ? 'connecting' : 'error'}
                label={systemStatus === 'healthy' ? 'System Healthy' : systemStatus === 'warning' ? 'Warning' : 'System Error'}
                size="sm"
              />
              <PerformanceDashboard compact={true} />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (!showSearch) {
                    setTimeout(() => {
                      const searchInput = document.getElementById('connection-search');
                      if (searchInput) searchInput.focus();
                    }, 100);
                  }
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                title="Search connections (Ctrl+F)"
              >
                🔍 Search
              </button>
              <button
                onClick={() => setShowHelpModal(true)}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                title="Show help (F1 or Shift+?)"
              >
                ❓ Help
              </button>
              <button
                onClick={() => setShowConnectionForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="Add new connection (Ctrl+N)"
              >
                ➕ Add Connection
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200">
          <div className="w-full px-4 py-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="connection-search"
                type="text"
                placeholder="Search connections by name, host, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-600">
                {filteredConnections.length === 0 
                  ? 'No connections match your search'
                  : `${filteredConnections.length} connection(s) found`
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <LoadingSpinner 
              size="lg" 
              color="blue" 
              label="Loading connections..." 
            />
          </div>
        )}

        {/* Connections List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              SSH Connections ({filteredConnections.length}{searchQuery ? ` of ${connections.length}` : ''})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredConnections.length === 0 ? (
              <div className="px-6 py-8 text-center">
                {searchQuery ? (
                  <div>
                    <p className="text-gray-500">No connections match "{searchQuery}"</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-blue-600 hover:text-blue-700"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500">No connections configured</p>
                    <button
                      onClick={() => setShowConnectionForm(true)}
                      className="mt-2 text-blue-600 hover:text-blue-700"
                    >
                      Add your first connection
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredConnections.map((connection) => (
                <div key={connection.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {connection.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {connection.username}@{connection.host}:{connection.port}
                      </p>
                      {connection.lastConnected && (
                        <p className="text-xs text-gray-400">
                          Last connected: {connection.lastConnected.toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <StatusIndicator
                        status={connection.isConnected ? 'online' : 'offline'}
                        label={connection.isConnected ? 'Connected' : 'Disconnected'}
                        size="sm"
                      />
                      
                      {connection.isConnected ? (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleBrowse(connection.id)}
                            disabled={selectedConnection === connection.id}
                            className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                              selectedConnection === connection.id
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {selectedConnection === connection.id ? 'Loading...' : 'Browse'}
                          </button>
                          <button 
                            onClick={() => handleDisconnect(connection.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleConnect(connection.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Development Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">
              System Status Dashboard
            </h3>
            <StatusIndicator
              status={systemStatus === 'healthy' ? 'online' : systemStatus === 'warning' ? 'connecting' : 'error'}
              showLabel={false}
              size="sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <StatusIndicator status="online" showLabel={false} size="sm" />
                <span className="text-blue-700">Frontend application</span>
              </div>
              <div className="flex items-center space-x-2">
                <StatusIndicator status="online" showLabel={false} size="sm" />
                <span className="text-blue-700">Backend API connection</span>
              </div>
              <div className="flex items-center space-x-2">
                <StatusIndicator status="online" showLabel={false} size="sm" />
                <span className="text-blue-700">Toast notification system</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <StatusIndicator status="online" showLabel={false} size="sm" />
                <span className="text-blue-700">Keyboard shortcuts</span>
              </div>
              <div className="flex items-center space-x-2">
                <StatusIndicator status="online" showLabel={false} size="sm" />
                <span className="text-blue-700">Search functionality</span>
              </div>
              <div className="flex items-center space-x-2">
                <StatusIndicator status={connections.some(c => c.isConnected) ? 'online' : 'idle'} showLabel={false} size="sm" />
                <span className="text-blue-700">SSH connections ({connections.filter(c => c.isConnected).length}/{connections.length})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Dashboard */}
        <div className="mt-6">
          <PerformanceDashboard />
        </div>
      </main>

      {/* Connection Form Modal */}
      {showConnectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ConnectionForm
            onSubmit={handleCreateConnection}
            onCancel={() => setShowConnectionForm(false)}
          />
        </div>
      )}

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
};

export default WorkingMainPage;