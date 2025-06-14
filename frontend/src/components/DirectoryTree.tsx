import React, { useState, useEffect } from 'react';
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

  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const canExpand = node.type === 'directory';

    return (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer ${
            selectedPath === node.path ? 'bg-blue-100 text-blue-800' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {canExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand(node);
              }}
              className="mr-1 w-4 h-4 flex items-center justify-center"
            >
              {node.isLoading ? (
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : node.isExpanded ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
          
          <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          
          <span
            onClick={() => handleDirectoryClick(node)}
            onDoubleClick={() => handleDirectoryDoubleClick(node)}
            className="flex-1 text-sm"
            title="Click to select, double-click to navigate"
          >
            {node.name}
          </span>
        </div>
        
        {node.isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        <p className="text-sm">Error loading directory tree:</p>
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Directory Structure</h3>
          <button
            onClick={navigateUp}
            disabled={currentPath === '/' || currentPath === ''}
            className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
            title="Go up one level"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          {getPathSegments(currentPath).map((segment, index, array) => (
            <React.Fragment key={segment.path}>
              <button
                onClick={() => navigateToPath(segment.path)}
                className="hover:text-blue-600 hover:underline"
              >
                {segment.name}
              </button>
              {index < array.length - 1 && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {isLoading && rootNodes.length === 0 ? (
          <div className="p-4 text-center">
            <div className="inline-block w-6 h-6 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-gray-600">Loading directories...</p>
          </div>
        ) : rootNodes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No directories found</p>
          </div>
        ) : (
          <div className="py-2">
            {rootNodes.map(node => renderNode(node))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryTree;