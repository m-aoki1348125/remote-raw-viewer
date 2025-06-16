import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { directoryApi, downloadApi } from '../services/api';
import { DirectoryItem, ThumbnailData } from '../types/directory';
import SearchBox from './SearchBox';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from './ui/LoadingSpinner';
import useAccessibility from '../hooks/useAccessibility';

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
  const [filteredImages, setFilteredImages] = useState<ImageWithThumbnail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [thumbnailSize, setThumbnailSize] = useState<'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'huge' | 'massive' | 'giant'>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const { showSuccess, showError } = useToast();
  const { announce, prefersReducedMotion } = useAccessibility();

  // Debug logging
  
  // Define grid configurations with aspect-ratio-consistent square thumbnails
  const sizeConfigs = {
    tiny: { 
      cols: 'grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 xl:grid-cols-24 2xl:grid-cols-32', 
      containerClass: 'w-16 h-16',
      imageClass: 'thumbnail-tiny',
      labelClass: 'text-xs'
    },
    small: { 
      cols: 'grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 xl:grid-cols-20 2xl:grid-cols-24', 
      containerClass: 'w-20 h-20',
      imageClass: 'thumbnail-small',
      labelClass: 'text-xs'
    },
    medium: { 
      cols: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16 2xl:grid-cols-20', 
      containerClass: 'w-24 h-24',
      imageClass: 'thumbnail-medium',
      labelClass: 'text-sm'
    },
    large: { 
      cols: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 2xl:grid-cols-16', 
      containerClass: 'w-32 h-32',
      imageClass: 'thumbnail-large',
      labelClass: 'text-sm'
    },
    xlarge: { 
      cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-12', 
      containerClass: 'w-40 h-40',
      imageClass: 'thumbnail-xlarge',
      labelClass: 'text-sm'
    },
    xxlarge: { 
      cols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8', 
      containerClass: 'w-48 h-48',
      imageClass: 'thumbnail-xxlarge',
      labelClass: 'text-base'
    },
    huge: { 
      cols: 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6', 
      containerClass: 'w-64 h-64',
      imageClass: 'thumbnail-huge',
      labelClass: 'text-base'
    },
    massive: { 
      cols: 'grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4', 
      containerClass: 'w-80 h-80',
      imageClass: 'thumbnail-massive',
      labelClass: 'text-lg'
    },
    giant: { 
      cols: 'grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3', 
      containerClass: 'w-96 h-96',
      imageClass: 'thumbnail-giant',
      labelClass: 'text-lg'
    }
  };
  
  const currentConfig = sizeConfigs[thumbnailSize];

  const increaseThumbnailSize = () => {
    const sizes = ['tiny', 'small', 'medium', 'large', 'xlarge', 'xxlarge', 'huge', 'massive', 'giant'] as const;
    const currentIndex = sizes.indexOf(thumbnailSize);
    if (currentIndex < sizes.length - 1) {
      setThumbnailSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseThumbnailSize = () => {
    const sizes = ['tiny', 'small', 'medium', 'large', 'xlarge', 'xxlarge', 'huge', 'massive', 'giant'] as const;
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
      // Load all directory items (including directories and images)
      const result = await directoryApi.list(connectionId, currentPath);
      const itemsWithThumbnails = result.items.map(item => ({
        ...item,
        thumbnailData: undefined,
        isLoadingThumbnail: false
      }));
      
      setImages(itemsWithThumbnails);
      setFilteredImages(itemsWithThumbnails);
      announce(`Loaded ${itemsWithThumbnails.length} items from ${currentPath}`, 'polite');

      // Load thumbnails only for image files
      const imageItems = itemsWithThumbnails.filter(item => item.type === 'file' && item.isImage);
      imageItems.forEach((image, index) => {
        const globalIndex = itemsWithThumbnails.findIndex(item => item.path === image.path);
        setTimeout(() => loadThumbnail(image, globalIndex), index * 50);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load directory';
      setError(errorMessage);
      showError('Load Failed', errorMessage);
      console.error('Error loading directory:', error);
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
      console.log(`Thumbnail loaded for ${image.name}:`, thumbnailData.success);
      
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
    if (image.type === 'directory') {
      // Single click on directory does nothing
      return;
    }
    onImageSelect(image);
  };

  const handleItemDoubleClick = useCallback((item: ImageWithThumbnail) => {
    if (item.type === 'directory') {
      // Double click on directory navigates to it
      if (onPathChange) {
        onPathChange(item.path);
      }
    } else if (item.isImage) {
      // Double click on image opens modal
      onImageSelect(item);
    }
  }, [onPathChange, onImageSelect]);

  const handleImageSelect = useCallback((imagePath: string, event: React.MouseEvent) => {
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
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // const formatDate = (timestamp: number): string => {
  //   return new Date(timestamp * 1000).toLocaleDateString();
  // };

  const handleDownloadSelected = useCallback(async () => {
    if (selectedImages.size === 0) return;

    try {
      const filePaths = Array.from(selectedImages);
      
      if (filePaths.length === 1) {
        await downloadApi.downloadSingle(connectionId, filePaths[0]);
        showSuccess('Download Started', 'Single image download initiated');
      } else {
        await downloadApi.downloadMultiple(connectionId, filePaths);
        showSuccess('Download Started', `${filePaths.length} images download initiated`);
      }
    } catch (error) {
      console.error('Error downloading images:', error);
      showError('Download Failed', 'Failed to start download');
    }
  }, [selectedImages, connectionId, showSuccess, showError]);

  const selectAllImages = useCallback(() => {
    setSelectedImages(new Set(filteredImages.map(img => img.path)));
    showSuccess('Selected All', `${filteredImages.length} images selected`);
  }, [filteredImages, showSuccess]);

  const clearSelection = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredImages(images);
    } else {
      const filtered = images.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.extension && item.extension.toLowerCase().includes(query.toLowerCase())) ||
        (item.type === 'directory' && item.name.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredImages(filtered);
      if (query.trim()) {
        announce(`Found ${filtered.length} matching items`, 'polite');
      }
    }
  }, [images, announce]);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [images, searchQuery, handleSearch]);

  const pathSegments = useMemo(() => {
    if (currentPath === '/' || currentPath === '') return [{ name: 'root', path: '/' }];
    
    const segments = currentPath.split('/').filter(Boolean);
    const result = [{ name: 'root', path: '/' }];
    
    let path = '';
    segments.forEach(segment => {
      path += '/' + segment;
      result.push({ name: segment, path });
    });
    
    return result;
  }, [currentPath]);

  const navigateToPath = useCallback((path: string) => {
    if (onPathChange) {
      onPathChange(path);
    }
  }, [onPathChange]);

  const navigateUp = useCallback(() => {
    if (currentPath === '/' || currentPath === '') return;
    
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    navigateToPath(parentPath);
  }, [currentPath, navigateToPath]);

  const getImageSrc = (item: ImageWithThumbnail): string => {
    if (!item.thumbnailData?.thumbnail_base64) {
      return '';
    }

    const ext = item.extension?.toLowerCase() || '';
    
    // Determine MIME type based on file extension
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
        // RAW images converted to PNG thumbnails
        mimeType = 'image/png';
        break;
      default:
        // Fallback to SVG for placeholders
        mimeType = 'image/svg+xml';
    }
    
    return `data:${mimeType};base64,${item.thumbnailData.thumbnail_base64}`;
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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Directory Browser</h3>
            <button
              onClick={navigateUp}
              disabled={currentPath === '/' || currentPath === ''}
              className="inline-flex items-center justify-center w-6 h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed rounded transition-colors"
              title="Up"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">
              {filteredImages.length}/{images.length} items
            </span>
            <span className="text-xs text-gray-500">
              ({filteredImages.filter(i => i.type === 'directory').length} folders, {filteredImages.filter(i => i.isImage).length} images)
            </span>
          </div>
        </div>
        
        {/* Compact Breadcrumb */}
        <div className="flex items-center space-x-1 mb-2 text-xs">
          {pathSegments.map((segment, index, array) => (
            <React.Fragment key={segment.path}>
              <button
                onClick={() => navigateToPath(segment.path)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  index === array.length - 1
                    ? 'text-green-700 bg-green-100 font-medium'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
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
        
        {/* Search Box */}
        <div className="mb-2">
          <SearchBox
            placeholder="Search folders and images..."
            onSearch={handleSearch}
            className="w-full"
            debounceMs={200}
          />
        </div>

        {/* Compact Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-32">{currentPath}</span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Compact Size Control */}
            <div className="flex items-center space-x-1 bg-white border border-gray-200 px-2 py-1 rounded">
              <button
                onClick={decreaseThumbnailSize}
                disabled={thumbnailSize === 'tiny'}
                className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                title="Decrease thumbnail size"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <div className="flex items-center space-x-0.5">
                {(['tiny', 'small', 'medium', 'large', 'xlarge', 'xxlarge', 'huge', 'massive', 'giant'] as const).map((size) => (
                  <div
                    key={size}
                    className={`w-1 h-1 rounded-full ${
                      size === thumbnailSize ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={increaseThumbnailSize}
                disabled={thumbnailSize === 'giant'}
                className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                title="Increase thumbnail size"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {/* Selection Controls */}
              {selectedImages.size > 0 ? (
                <div className="flex items-center space-x-1 bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                  <span className="text-xs text-blue-700">
                    {selectedImages.size} selected
                  </span>
                  <button
                    onClick={handleDownloadSelected}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    title={`Download ${selectedImages.size} selected image(s)`}
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={clearSelection}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded transition-colors"
                    title="Clear selection"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : filteredImages.length > 0 && (
                <button
                  onClick={selectAllImages}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded transition-colors"
                  title="Select all images"
                >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                All
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8">
          <LoadingSpinner 
            size="large" 
            message="Loading images..." 
            reduceMotion={prefersReducedMotion()}
          />
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-gray-600">
              {searchQuery ? 'No matching items' : 'No items found'}
            </p>
            <p className="text-sm text-gray-500">
              {searchQuery ? `No folders or images match "${searchQuery}"` : 'Directory is empty'}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3">
          <div 
            className={`grid ${currentConfig.cols} gap-2`}
            role="grid"
            aria-label={`Directory view: ${filteredImages.length} items`}
          >
            {filteredImages.map((item, index) => (
              <div
                key={item.path}
                className={`thumbnail-container relative group cursor-pointer rounded-lg overflow-hidden border ${
                  selectedImages.has(item.path)
                    ? 'border-blue-500 shadow-md'
                    : 'border-gray-200 hover:border-blue-300'
                } ${item.type === 'directory' ? 'bg-blue-50' : ''}`}
                onClick={() => handleImageClick(item)}
                onDoubleClick={() => handleItemDoubleClick(item)}
                role="gridcell"
                tabIndex={0}
                aria-label={`${item.type === 'directory' ? 'Folder' : 'File'} ${index + 1} of ${filteredImages.length}: ${item.name}, ${formatFileSize(item.size)}${selectedImages.has(item.path) ? ', selected' : ''}`}
                aria-selected={selectedImages.has(item.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (item.type === 'directory') {
                      handleItemDoubleClick(item);
                    } else {
                      handleImageClick(item);
                    }
                  }
                }}
              >
                {/* Compact Selection Checkbox - Only for files */}
                {item.type === 'file' && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`w-4 h-4 rounded-md transition-all duration-200 ${
                      selectedImages.has(item.path)
                        ? 'bg-blue-600 shadow-md'
                        : 'bg-white/90 border border-gray-300 hover:bg-white'
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedImages.has(item.path)}
                        onChange={(e) => handleImageSelect(item.path, e as any)}
                        className="w-full h-full opacity-0 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select file ${item.name}`}
                      />
                      {selectedImages.has(item.path) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Square Thumbnail */}
                <div className={`${currentConfig.containerClass} bg-gray-100 flex flex-col mx-auto relative overflow-hidden rounded-lg`}>
                  {/* Square Image Area */}
                  <div className="relative w-full flex-1 bg-gray-50 overflow-hidden">
                    {item.type === 'directory' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                        <div className="w-1/2 h-1/2 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                          <svg className="w-1/2 h-1/2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                      </div>
                    ) : item.isLoadingThumbnail ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                          <span className={`${currentConfig.labelClass} text-gray-600 font-medium`}>Loading</span>
                        </div>
                      </div>
                    ) : item.thumbnailData?.success && item.thumbnailData.thumbnail_base64 ? (
                      <>
                        {/* Debug: Log what we're rendering */}
                        {console.log(`Rendering image for ${item.name}:`, { 
                          hasData: !!item.thumbnailData?.thumbnail_base64,
                          success: item.thumbnailData?.success,
                          src: getImageSrc(item).substring(0, 50) + '...'
                        })}
                        <img
                          src={getImageSrc(item)}
                          alt={item.name}
                          className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${currentConfig.imageClass} ${item.extension === 'raw' ? 'raw-thumbnail' : ''}`}
                          onLoad={() => console.log(`Image loaded successfully for ${item.name}`)}
                          onError={(e) => {
                            console.error(`Image load error for ${item.name}`);
                            // Fallback to placeholder on image load error
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {/* Aspect ratio indicator */}
                        <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {item.extension?.toUpperCase()}
                        </div>
                        {/* Fallback icon for failed image loads */}
                        <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                          <div className="w-1/3 h-1/3 bg-gray-300 rounded flex items-center justify-center">
                            <svg className="w-1/2 h-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <div className="w-1/3 h-1/3 bg-gray-300 rounded flex items-center justify-center">
                          {item.isImage ? (
                            <svg className="w-1/2 h-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-1/2 h-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Label Area */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-1 py-1 border-t border-gray-200">
                    <div className={`${currentConfig.labelClass} text-gray-700 font-medium truncate text-center leading-tight`} title={item.name}>
                      {item.name}
                    </div>
                    {item.type === 'file' && (
                      <div className="text-xs text-gray-500 text-center">
                        {formatFileSize(item.size)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Info - Only for Directories */}
                {item.type === 'directory' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-xs text-center">
                      Double-click to open
                    </p>
                  </div>
                )}

                {/* Compact RAW Indicator */}
                {item.extension === 'raw' && (
                  <div className="absolute top-1 right-1 z-10">
                    <div className="bg-purple-600 text-white text-xs font-bold px-1 py-0.5 rounded-full">
                      RAW
                    </div>
                  </div>
                )}

                {/* Directory Indicator */}
                {item.type === 'directory' && (
                  <div className="absolute top-1 right-1 z-10">
                    <div className="bg-blue-600 text-white text-xs font-bold px-1 py-0.5 rounded-full">
                      📁
                    </div>
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