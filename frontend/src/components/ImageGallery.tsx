import React, { useState, useEffect, useCallback } from 'react';
import { directoryApi, downloadApi } from '../services/api';
import { DirectoryItem, ThumbnailData } from '../types/directory';

interface ImageGalleryProps {
  connectionId: string;
  currentPath: string;
  onImageSelect: (image: DirectoryItem) => void;
  onPathChange?: (path: string) => void;
}

interface ImageWithThumbnail extends DirectoryItem {
  thumbnailData?: ThumbnailData;
  isLoadingThumbnail?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  connectionId,
  currentPath,
  onImageSelect,
  onPathChange
}) => {
  const [images, setImages] = useState<ImageWithThumbnail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [thumbnailSize, setThumbnailSize] = useState<'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'>('medium');
  
  // Define grid configurations directly
  const sizeConfigs = {
    small: { cols: 'grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16', size: 'w-12 h-12' },
    medium: { cols: 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12', size: 'w-16 h-16' },
    large: { cols: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10', size: 'w-20 h-20' },
    xlarge: { cols: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8', size: 'w-24 h-24' },
    xxlarge: { cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6', size: 'w-32 h-32' }
  };
  
  const currentConfig = sizeConfigs[thumbnailSize];

  const increaseThumbnailSize = () => {
    const sizes = ['small', 'medium', 'large', 'xlarge', 'xxlarge'] as const;
    const currentIndex = sizes.indexOf(thumbnailSize);
    if (currentIndex < sizes.length - 1) {
      setThumbnailSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseThumbnailSize = () => {
    const sizes = ['small', 'medium', 'large', 'xlarge', 'xxlarge'] as const;
    const currentIndex = sizes.indexOf(thumbnailSize);
    if (currentIndex > 0) {
      setThumbnailSize(sizes[currentIndex - 1]);
    }
  };

  useEffect(() => {
    if (connectionId && currentPath) {
      loadImages();
    }
  }, [connectionId, currentPath]);

  const loadImages = async () => {
    setIsLoading(true);
    setError(null);
    setImages([]);

    try {
      const result = await directoryApi.getImages(connectionId, currentPath);
      const imagesWithThumbnails = result.images.map(image => ({
        ...image,
        thumbnailData: undefined,
        isLoadingThumbnail: false
      }));
      
      setImages(imagesWithThumbnails);

      // Load thumbnails lazily
      imagesWithThumbnails.forEach((image, index) => {
        setTimeout(() => loadThumbnail(image, index), index * 100);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load images';
      setError(errorMessage);
      console.error('Error loading images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadThumbnail = useCallback(async (image: DirectoryItem, index: number) => {
    setImages(prevImages => 
      prevImages.map((img, i) => 
        i === index ? { ...img, isLoadingThumbnail: true } : img
      )
    );

    try {
      const thumbnailData = await directoryApi.getThumbnail(connectionId, image.path);
      
      setImages(prevImages => 
        prevImages.map((img, i) => 
          i === index ? { 
            ...img, 
            thumbnailData,
            isLoadingThumbnail: false 
          } : img
        )
      );
    } catch (error) {
      console.error(`Failed to load thumbnail for ${image.name}:`, error);
      
      setImages(prevImages => 
        prevImages.map((img, i) => 
          i === index ? { 
            ...img, 
            isLoadingThumbnail: false,
            thumbnailData: {
              success: false,
              error: 'Failed to load thumbnail'
            }
          } : img
        )
      );
    }
  }, [connectionId]);

  const handleImageClick = (image: ImageWithThumbnail) => {
    onImageSelect(image);
  };

  const handleImageSelect = (imagePath: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setSelectedImages(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(imagePath)) {
        newSelected.delete(imagePath);
      } else {
        newSelected.add(imagePath);
      }
      return newSelected;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const handleDownloadSelected = async () => {
    if (selectedImages.size === 0) return;

    try {
      const filePaths = Array.from(selectedImages);
      
      if (filePaths.length === 1) {
        await downloadApi.downloadSingle(connectionId, filePaths[0]);
      } else {
        await downloadApi.downloadMultiple(connectionId, filePaths);
      }
    } catch (error) {
      console.error('Error downloading images:', error);
    }
  };

  const selectAllImages = () => {
    setSelectedImages(new Set(images.map(img => img.path)));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
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

  const navigateToPath = (path: string) => {
    if (onPathChange) {
      onPathChange(path);
    }
  };

  const navigateUp = () => {
    if (currentPath === '/' || currentPath === '') return;
    
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    navigateToPath(parentPath);
  };

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        <p className="text-sm">Error loading images:</p>
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        {/* Path Navigation */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900">Images</h3>
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
          <span className="text-sm text-gray-600">({images.length} items)</span>
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-1 text-xs text-gray-600 mb-2">
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
        
        {/* Selection Controls */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Current: {currentPath}
          </div>
          <div className="flex items-center space-x-4">
            {/* Simple Thumbnail Size Control */}
            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded">
              <span className="text-xs text-gray-600">Size:</span>
              <button
                onClick={decreaseThumbnailSize}
                className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                disabled={thumbnailSize === 'small'}
              >
                -
              </button>
              <span className="text-xs font-medium min-w-16 text-center">
                {thumbnailSize.charAt(0).toUpperCase() + thumbnailSize.slice(1)}
              </span>
              <button
                onClick={increaseThumbnailSize}
                className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                disabled={thumbnailSize === 'xxlarge'}
              >
                +
              </button>
            </div>
            
            {/* Selection buttons */}
            <div className="flex items-center space-x-2">
            {selectedImages.size > 0 && (
              <>
                <span className="text-sm text-blue-600">
                  {selectedImages.size} selected
                </span>
                <button
                  onClick={handleDownloadSelected}
                  className="px-2 py-1 text-xs font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700"
                >
                  Download
                </button>
                <button
                  onClick={clearSelection}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Clear
                </button>
              </>
            )}
            
            {images.length > 0 && selectedImages.size === 0 && (
              <button
                onClick={selectAllImages}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Select All
              </button>
            )}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="inline-block w-8 h-8 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-sm text-gray-600">Loading images...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm">No images found in this directory</p>
        </div>
      ) : (
        <div className="p-4">
          <div className={`grid ${currentConfig.cols} gap-4`}>
            {images.map((image) => (
              <div
                key={image.path}
                className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden hover:shadow-lg transition-all ${
                  selectedImages.has(image.path)
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleImageClick(image)}
              >
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedImages.has(image.path)}
                    onChange={(e) => handleImageSelect(image.path, e as any)}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Thumbnail */}
                <div className={`${currentConfig.size} bg-gray-100 flex items-center justify-center mx-auto`}>
                  {image.isLoadingThumbnail ? (
                    <div className="w-6 h-6 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : image.thumbnailData?.success && image.thumbnailData.thumbnail_base64 ? (
                    <img
                      src={`data:image/jpeg;base64,${image.thumbnailData.thumbnail_base64}`}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-500 mt-1">No preview</p>
                    </div>
                  )}
                </div>

                {/* Image info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  <p className="text-xs font-medium truncate" title={image.name}>
                    {image.name}
                  </p>
                  <p className="text-xs opacity-75">
                    {formatFileSize(image.size)} • {formatDate(image.modified)}
                  </p>
                </div>

                {/* RAW indicator */}
                {image.extension === '.raw' && (
                  <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded">
                    RAW
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;