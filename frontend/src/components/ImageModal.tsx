import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DirectoryItem } from '../types/directory';
import { directoryApi, downloadApi } from '../services/api';
import { useToast } from '../hooks/useToast';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: DirectoryItem | null;
  connectionId: string;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  image,
  connectionId
}) => {
  const [fullImageData, setFullImageData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [showMetadata, setShowMetadata] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showZoomControls, setShowZoomControls] = useState(false);
  
  // Toast notifications
  const { showSuccess, showError, showInfo } = useToast();
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zoom limits
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 50;

  useEffect(() => {
    if (isOpen && image && connectionId) {
      loadFullImage();
      loadMetadata();
      resetZoom();
    } else {
      setFullImageData(null);
      setMetadata(null);
      setError(null);
      resetZoom();
    }
  }, [isOpen, image, connectionId]);
  
  // Reset zoom and pan when modal opens/closes
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setIsDragging(false);
  }, []);
  
  // Zoom functions
  const handleZoomChange = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    setZoom(clampedZoom);
    
    // Reset pan when zooming out to fit or below
    if (clampedZoom <= 1) {
      setPanX(0);
      setPanY(0);
    }
  }, []);
  
  const zoomIn = useCallback(() => {
    handleZoomChange(zoom * 1.2);
  }, [zoom, handleZoomChange]);
  
  const zoomOut = useCallback(() => {
    handleZoomChange(zoom / 1.2);
  }, [zoom, handleZoomChange]);
  
  const fitToScreen = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // Mouse and keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'm':
        case 'M':
          setShowMetadata(prev => !prev);
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          fitToScreen();
          break;
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      if (!isOpen || !e.ctrlKey) return;
      
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoomChange(zoom + delta);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen, onClose, zoom, zoomIn, zoomOut, fitToScreen, handleZoomChange]);

  const loadFullImage = async () => {
    if (!image || !connectionId) return;

    setIsLoading(true);
    setError(null);

    try {
      // For now, use thumbnail as full image
      // In a real implementation, you'd have a separate endpoint for full images
      const thumbnailData = await directoryApi.getThumbnail(connectionId, image.path);
      
      if (thumbnailData.success && thumbnailData.thumbnail_base64) {
        // Determine correct MIME type based on file extension
        const ext = image.extension?.toLowerCase() || '';
        let mimeType: string;
        switch (ext) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          case 'raw':
            // RAW images are converted to PNG thumbnails
            mimeType = 'image/png';
            break;
          default:
            mimeType = 'image/jpeg'; // Fallback
        }
        setFullImageData(`data:${mimeType};base64,${thumbnailData.thumbnail_base64}`);
      } else {
        setError('Failed to load image');
      }
    } catch (error) {
      console.error('Error loading full image:', error);
      setError('Failed to load image');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetadata = async () => {
    if (!image || !connectionId) return;

    try {
      const metadataResult = await directoryApi.getMetadata(connectionId, image.path);
      setMetadata(metadataResult);
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Pan (drag) functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return; // Only allow panning when zoomed in
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  }, [zoom, panX, panY]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    
    e.preventDefault();
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  }, [isDragging, zoom, dragStart]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDownload = async () => {
    if (!image || !connectionId) {
      showError('Download Failed', 'Image or connection information is missing');
      return;
    }

    setIsDownloading(true);
    showInfo('Download Starting', `Downloading ${image.name}...`);

    try {
      await downloadApi.downloadSingle(connectionId, image.path);
      showSuccess('Download Complete', `${image.name} has been downloaded successfully`);
    } catch (error) {
      console.error('Error downloading image:', error);
      const message = error instanceof Error ? error.message : 'Unknown download error';
      showError('Download Failed', `Could not download ${image.name}: ${message}`);
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Show/hide zoom controls on mouse movement
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowZoomControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowZoomControls(false), 3000);
    };
    
    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove);
      handleMouseMove(); // Show initially
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isOpen]);
  
  // Image transform style
  const imageStyle = {
    maxWidth: zoom === 1 ? '100%' : 'none',
    maxHeight: zoom === 1 ? '100%' : 'none',
    objectFit: 'contain' as const,
    transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
    transformOrigin: 'center center',
    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    imageRendering: 'pixelated' as const,
  };

  if (!isOpen || !image) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 transition-all duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-black w-full h-full overflow-hidden flex flex-col transform transition-all duration-300 scale-100 animate-in">
        {/* Minimal Header with Dark Theme */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white truncate drop-shadow-md" title={image.name}>
                {image.name}
              </h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-xs text-gray-300">{formatFileSize(image.size)}</span>
                <span className="text-xs text-gray-300">{image.extension?.toUpperCase() || 'UNKNOWN'}</span>
                {image.extension === 'raw' && (
                  <span className="text-xs text-purple-300 font-medium">
                    {image.size === 327680 ? '640×512' : 
                     Math.sqrt(image.size) % 1 === 0 ? `${Math.sqrt(image.size)}×${Math.sqrt(image.size)}` :
                     'RAW'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`group inline-flex items-center px-3 py-2 text-xs font-medium text-white backdrop-blur-sm border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                isDownloading
                  ? 'bg-gray-500/30 border-gray-400/30 cursor-not-allowed'
                  : 'bg-blue-600/80 border-blue-500/50 hover:bg-blue-600/90'
              }`}
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 mr-1.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="group inline-flex items-center justify-center w-8 h-8 text-white bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg shadow-sm transition-all duration-200 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Full Screen Image Display */}
        <div 
          ref={containerRef}
          className="flex-1 flex items-center justify-center bg-black relative overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {isLoading ? (
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin mx-auto"></div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-white">Loading image...</p>
                <p className="text-sm text-gray-400">Please wait while we fetch the image data</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-red-900/30 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-red-400">Failed to load image</p>
                <p className="text-sm text-red-300">{error}</p>
                <button
                  onClick={loadFullImage}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-900/50 hover:bg-red-900/70 border border-red-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>
              </div>
            </div>
          ) : fullImageData ? (
            <img
              ref={imageRef}
              src={fullImageData}
              alt={image.name}
              style={imageStyle}
            />
          ) : (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-400">No preview available</p>
                <p className="text-sm text-gray-500">This image format might not be supported for preview</p>
              </div>
            </div>
          )}
          
          {/* Simple Metadata Display */}
          {showMetadata && (
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3 text-white max-w-sm">
              <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Path:</span>
                <span className="font-mono text-gray-200 ml-2 truncate" style={{ maxWidth: '200px' }}>{image.path}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Size:</span>
                <span className="text-gray-200">{formatFileSize(image.size)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Modified:</span>
                <span className="text-gray-200">{new Date(image.modified).toLocaleDateString()}</span>
              </div>
              {image.extension === 'raw' && (
                <div className="flex items-center justify-between pt-1 border-t border-gray-700">
                  <span className="text-purple-400">RAW:</span>
                  <span className="text-purple-300">
                    {image.size === 327680 ? '640×512 grayscale' : 
                     Math.sqrt(image.size) % 1 === 0 ? `${Math.sqrt(image.size)}×${Math.sqrt(image.size)} grayscale` :
                     'Custom format'}
                  </span>
                </div>
              )}
              {/* Zoom info */}
              {zoom !== 1 && (
                <div className="flex items-center justify-between pt-1 border-t border-gray-700">
                  <span className="text-blue-400">Zoom:</span>
                  <span className="text-blue-300">{Math.round(zoom * 100)}%</span>
                </div>
              )}
            </div>
          </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default ImageModal;