import React, { useState, useEffect } from 'react';
import { DirectoryItem } from '../types/directory';
import { directoryApi, downloadApi } from '../services/api';

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

  useEffect(() => {
    if (isOpen && image && connectionId) {
      loadFullImage();
      loadMetadata();
    } else {
      setFullImageData(null);
      setMetadata(null);
      setError(null);
    }
  }, [isOpen, image, connectionId]);

  const loadFullImage = async () => {
    if (!image || !connectionId) return;

    setIsLoading(true);
    setError(null);

    try {
      // For now, use thumbnail as full image
      // In a real implementation, you'd have a separate endpoint for full images
      const thumbnailData = await directoryApi.getThumbnail(connectionId, image.path);
      
      if (thumbnailData.success && thumbnailData.thumbnail_base64) {
        setFullImageData(`data:image/jpeg;base64,${thumbnailData.thumbnail_base64}`);
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

  const handleDownload = async () => {
    if (image && connectionId) {
      try {
        await downloadApi.downloadSingle(connectionId, image.path);
      } catch (error) {
        console.error('Error downloading image:', error);
      }
    }
  };

  if (!isOpen || !image) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-lg font-medium text-gray-900 truncate" title={image.name}>
              {image.name}
            </h2>
            <p className="text-sm text-gray-500">
              {formatFileSize(image.size)} • {formatDate(image.modified)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Download
            </button>
            
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Image */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            {isLoading ? (
              <div className="text-center">
                <div className="w-8 h-8 border border-gray-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading image...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-600">
                <svg className="w-12 h-12 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm">{error}</p>
              </div>
            ) : fullImageData ? (
              <img
                src={fullImageData}
                alt={image.name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm">No image preview available</p>
              </div>
            )}
          </div>

          {/* Metadata sidebar */}
          <div className="w-64 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-900 mb-3">File Information</h3>
            
            <div className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</dt>
                <dd className="text-sm text-gray-900 break-words">{image.name}</dd>
              </div>
              
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</dt>
                <dd className="text-sm text-gray-900">{formatFileSize(image.size)}</dd>
              </div>
              
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</dt>
                <dd className="text-sm text-gray-900">{image.extension || 'Unknown'}</dd>
              </div>
              
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Modified</dt>
                <dd className="text-sm text-gray-900">{formatDate(image.modified)}</dd>
              </div>
              
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Path</dt>
                <dd className="text-sm text-gray-900 break-all">{image.path}</dd>
              </div>

              {image.extension === '.raw' && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">RAW Info</dt>
                  <dd className="text-sm text-gray-900">
                    {image.size === 327680 ? '640×512 grayscale' : 
                     Math.sqrt(image.size) % 1 === 0 ? `${Math.sqrt(image.size)}×${Math.sqrt(image.size)} grayscale` :
                     'Invalid RAW format'}
                  </dd>
                </div>
              )}

              {metadata && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Permissions</dt>
                  <dd className="text-sm text-gray-900">{metadata.permissions || 'Unknown'}</dd>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;