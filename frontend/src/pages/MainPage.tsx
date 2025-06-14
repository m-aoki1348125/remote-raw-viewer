import React, { useState, useEffect } from 'react';
import { connectionApi } from '../services/api';
import { SSHConnection } from '../types/connection';
import { DirectoryItem } from '../types/directory';
import ConnectionList from '../components/ConnectionList';
import ConnectionForm from '../components/ConnectionForm';
import DirectoryTree from '../components/DirectoryTree';
import ImageGallery from '../components/ImageGallery';
import ImageModal from '../components/ImageModal';

type ViewMode = 'connections' | 'browser';

const MainPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('connections');
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<SSHConnection | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedImage, setSelectedImage] = useState<DirectoryItem | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SSHConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug current state
  console.log('MainPage render - viewMode:', viewMode, 'activeConnection:', activeConnection?.name, 'currentPath:', currentPath);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const connectionList = await connectionApi.getAll();
      setConnections(connectionList);
      
      // Auto-select first connected connection
      const connectedConnection = connectionList.find(conn => conn.isConnected);
      if (connectedConnection && !activeConnection) {
        setActiveConnection(connectedConnection);
        setViewMode('browser');
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      setError('Failed to load connections');
    }
  };

  const handleConnect = async (id: string) => {
    console.log('handleConnect called with id:', id);
    setIsLoading(true);
    setError(null);

    try {
      // Check if already connected, if so just switch to browser mode
      const existingConnection = connections.find(conn => conn.id === id);
      if (existingConnection?.isConnected) {
        console.log('Already connected, switching to browser mode');
        setActiveConnection(existingConnection);
        setViewMode('browser');
        setCurrentPath('/');
        setIsLoading(false);
        return;
      }

      const connection = await connectionApi.connect(id);
      console.log('Connection successful:', connection);
      
      setConnections(prev => prev.map(conn => 
        conn.id === id ? connection : conn
      ));
      setActiveConnection(connection);
      setViewMode('browser');
      setCurrentPath('/');
      
      console.log('State updated - viewMode: browser, activeConnection:', connection.name);
    } catch (error) {
      console.error('Error connecting:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const connection = await connectionApi.disconnect(id);
      setConnections(prev => prev.map(conn => 
        conn.id === id ? connection : conn
      ));
      
      if (activeConnection?.id === id) {
        setActiveConnection(null);
        setViewMode('connections');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      setError('Failed to disconnect from server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const connection = connections.find(conn => conn.id === id);
    if (connection) {
      setEditingConnection(connection);
      setShowConnectionForm(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    try {
      await connectionApi.delete(id);
      setConnections(prev => prev.filter(conn => conn.id !== id));
      
      if (activeConnection?.id === id) {
        setActiveConnection(null);
        setViewMode('connections');
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      setError('Failed to delete connection');
    }
  };

  const handleConnectionFormSubmit = async (data: any) => {
    try {
      if (editingConnection) {
        const updatedConnection = await connectionApi.update(editingConnection.id, data);
        setConnections(prev => prev.map(conn => 
          conn.id === editingConnection.id ? updatedConnection : conn
        ));
      } else {
        const newConnection = await connectionApi.create(data);
        setConnections(prev => [...prev, newConnection]);
      }
      
      setShowConnectionForm(false);
      setEditingConnection(null);
    } catch (error) {
      console.error('Error saving connection:', error);
      setError('Failed to save connection');
    }
  };

  const handleConnectionFormCancel = () => {
    setShowConnectionForm(false);
    setEditingConnection(null);
  };

  const handleDirectorySelect = (path: string) => {
    setCurrentPath(path);
  };

  const handlePathChange = (path: string) => {
    setCurrentPath(path);
  };

  const handleImageSelect = (image: DirectoryItem) => {
    setSelectedImage(image);
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  };

  const handleBackToConnections = () => {
    setViewMode('connections');
    setActiveConnection(null);
    setCurrentPath('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Remote Raw Viewer</h1>
              
              {activeConnection && (
                <div className="ml-4 flex items-center">
                  <span className="text-gray-500">•</span>
                  <span className="ml-2 text-sm text-gray-600">
                    Connected to <span className="font-medium">{activeConnection.name}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {viewMode === 'browser' && (
                <button
                  onClick={handleBackToConnections}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Connections
                </button>
              )}
              
              {viewMode === 'connections' && (
                <button
                  onClick={() => setShowConnectionForm(true)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  New Connection
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'connections' ? (
          <div className="space-y-6">
            <ConnectionList
              connections={connections}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Directory tree sidebar */}
            <div className="lg:col-span-1">
              <DirectoryTree
                connectionId={activeConnection?.id || ''}
                onDirectorySelect={handleDirectorySelect}
                initialPath={currentPath}
              />
            </div>

            {/* Image gallery */}
            <div className="lg:col-span-3">
              <ImageGallery
                connectionId={activeConnection?.id || ''}
                currentPath={currentPath}
                onImageSelect={handleImageSelect}
                onPathChange={handlePathChange}
              />
            </div>
          </div>
        )}
      </main>

      {/* Connection form modal */}
      {showConnectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <ConnectionForm
              onSubmit={handleConnectionFormSubmit}
              onCancel={handleConnectionFormCancel}
              initialData={editingConnection ? {
                name: editingConnection.name,
                host: editingConnection.host,
                port: editingConnection.port,
                username: editingConnection.username,
                password: '',
                privateKey: '',
                authMethod: 'password'
              } : undefined}
            />
          </div>
        </div>
      )}

      {/* Image modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={handleCloseImageModal}
        image={selectedImage}
        connectionId={activeConnection?.id || ''}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="w-6 h-6 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;