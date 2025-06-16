import React, { useState, useEffect, useMemo } from 'react';
import { directoryApi } from '../services/api';
import { DirectoryItem } from '../types/directory';

interface DirectoryTreeProps {
  connectionId: string;
  onDirectorySelect: (path: string) => void;
  initialPath?: string;
}

interface TreeNode extends DirectoryItem {
  isExpanded?: boolean;
  children?: TreeNode[];
  isLoading?: boolean;
}

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  connectionId,
  onDirectorySelect,
  initialPath = '/'
}) => {
  const [rootNodes, setRootNodes] = useState<TreeNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>(initialPath);
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connectionId) {
      loadDirectory(initialPath);
      setCurrentPath(initialPath);
    }
  }, [connectionId, initialPath]);

  const loadDirectory = async (path: string, parentNode?: TreeNode) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await directoryApi.list(connectionId, path);
      
      // Filter for directories only
      const directories = result.items
        .filter(item => item.type === 'directory')
        .map(item => ({
          ...item,
          isExpanded: false,
          children: [],
          isLoading: false
        }));

      if (parentNode) {
        // Update children of parent node
        setRootNodes(prevNodes => updateNodeChildren(prevNodes, parentNode.path, directories));
        parentNode.isLoading = false;
      } else {
        // Set root nodes
        setRootNodes(directories);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load directory';
      setError(errorMessage);
      console.error('Error loading directory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateNodeChildren = (nodes: TreeNode[], targetPath: string, children: TreeNode[]): TreeNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return {
          ...node,
          children,
          isExpanded: true,
          isLoading: false
        };
      } else if (node.children) {
        return {
          ...node,
          children: updateNodeChildren(node.children, targetPath, children)
        };
      }
      return node;
    });
  };

  const handleToggleExpand = async (node: TreeNode) => {
    if (node.isExpanded) {
      // Collapse
      setRootNodes(prevNodes => toggleNodeExpansion(prevNodes, node.path, false));
    } else {
      // Expand - load children if not already loaded
      if (!node.children || node.children.length === 0) {
        // Set loading state
        setRootNodes(prevNodes => setNodeLoading(prevNodes, node.path, true));
        await loadDirectory(node.path, node);
      } else {
        // Just expand
        setRootNodes(prevNodes => toggleNodeExpansion(prevNodes, node.path, true));
      }
    }
  };

  const toggleNodeExpansion = (nodes: TreeNode[], targetPath: string, isExpanded: boolean): TreeNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return { ...node, isExpanded };
      } else if (node.children) {
        return {
          ...node,
          children: toggleNodeExpansion(node.children, targetPath, isExpanded)
        };
      }
      return node;
    });
  };

  const setNodeLoading = (nodes: TreeNode[], targetPath: string, isLoading: boolean): TreeNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return { ...node, isLoading };
      } else if (node.children) {
        return {
          ...node,
          children: setNodeLoading(node.children, targetPath, isLoading)
        };
      }
      return node;
    });
  };

  const handleDirectoryClick = (node: TreeNode) => {
    setSelectedPath(node.path);
    onDirectorySelect(node.path);
  };

  const handleDirectoryDoubleClick = (node: TreeNode) => {
    navigateToPath(node.path);
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSelectedPath(path);
    onDirectorySelect(path);
    loadDirectory(path);
  };

  const navigateUp = () => {
    if (currentPath === '/' || currentPath === '') return;
    
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    navigateToPath(parentPath);
  };

  const getPathSegments = (path: string) => {
    if (path === '/' || path === '') return [{ name: 'root', path: '/' }];
    
    const segments = path.split('/').filter(Boolean);
    const result = [{ name: 'root', path: '/' }];
    
    let currentPath = '';
    segments.forEach(segment => {
      currentPath += '/' + segment;
      result.push({ name: segment, path: currentPath });
    });
    
    return result;
  };

  const renderNode = useMemo(() => (node: TreeNode, level: number = 0): React.ReactNode => {
    const canExpand = node.type === 'directory';

    return (
      <div key={node.path} className="select-none">
        <div
          className={`group flex items-center py-1 px-2 hover:bg-blue-50 cursor-pointer rounded mx-1 transition-colors ${
            selectedPath === node.path 
              ? 'bg-blue-100 text-blue-800' 
              : 'text-gray-700 hover:text-blue-700'
          }`}
          style={{ paddingLeft: `${level * 10 + 4}px` }}
        >
          {canExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand(node);
              }}
              className="mr-1 w-4 h-4 flex items-center justify-center rounded hover:bg-white/50 transition-colors"
            >
              {node.isLoading ? (
                <div className="w-2 h-2 border border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : node.isExpanded ? (
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          )}
          
          <div className="flex items-center space-x-1">
            <span className="text-blue-600 text-sm">
              {node.isExpanded ? '📂' : '📁'}
            </span>
          
            <span
              onClick={() => handleDirectoryClick(node)}
              onDoubleClick={() => handleDirectoryDoubleClick(node)}
              className="flex-1 text-sm transition-colors truncate"
              title={node.name}
              role="button"
              tabIndex={0}
            >
              {node.name}
            </span>
          </div>
        </div>
        
        {node.isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  }, [selectedPath, handleDirectoryClick, handleDirectoryDoubleClick, handleToggleExpand]);

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        <p className="text-sm">Error loading directory tree:</p>
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Directories</h3>
          </div>
          <button
            onClick={navigateUp}
            disabled={currentPath === '/' || currentPath === ''}
            className="inline-flex items-center justify-center w-6 h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed rounded transition-colors"
            title="Go up"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
        
        {/* Compact Breadcrumb */}
        <div className="flex items-center space-x-1 text-xs">
          {getPathSegments(currentPath).map((segment, index, array) => (
            <React.Fragment key={segment.path}>
              <button
                onClick={() => navigateToPath(segment.path)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  index === array.length - 1
                    ? 'text-blue-700 bg-blue-100 font-medium'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {segment.name === 'root' ? '🏠' : segment.name}
              </button>
              {index < array.length - 1 && (
                <span className="text-gray-400">/</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {isLoading && rootNodes.length === 0 ? (
          <div className="p-4 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-700">Loading...</p>
          </div>
        ) : rootNodes.length === 0 ? (
          <div className="p-4 text-center space-y-2">
            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mx-auto">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">No directories</p>
          </div>
        ) : (
          <div className="py-1">
            {rootNodes.map(node => renderNode(node))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryTree;