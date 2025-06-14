import React from 'react';
import { SSHConnection } from '../types/connection';

interface ConnectionListProps {
  connections: SSHConnection[];
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ConnectionList: React.FC<ConnectionListProps> = ({
  connections,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete
}) => {
  const formatLastConnected = (date?: Date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (connections.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No connections configured</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first server connection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {connections.map((connection) => (
        <div
          key={connection.id}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">{connection.name}</h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    connection.isConnected
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {connection.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Host:</span> {connection.host}:{connection.port}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Username:</span> {connection.username}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Last connected:</span> {formatLastConnected(connection.lastConnected)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-6">
              {connection.isConnected ? (
                <>
                  <button
                    onClick={() => onConnect(connection.id)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Browse Files
                  </button>
                  <button
                    onClick={() => onDisconnect(connection.id)}
                    className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onConnect(connection.id)}
                  className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Connect
                </button>
              )}
              
              <button
                onClick={() => onEdit(connection.id)}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit
              </button>
              
              <button
                onClick={() => onDelete(connection.id)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConnectionList;