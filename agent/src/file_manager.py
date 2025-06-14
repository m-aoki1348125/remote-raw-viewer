"""
File Manager Module
Handles file system operations and metadata extraction
"""

import os
import stat
from typing import Dict, List, Any
from pathlib import Path


class FileManager:
    """Manages file system operations"""
    
    SUPPORTED_IMAGE_EXTENSIONS = {
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.raw', '.bmp', '.tiff'
    }
    
    def list_directory(self, directory_path: str) -> Dict[str, Any]:
        """List directory contents with file information"""
        try:
            path = Path(directory_path)
            if not path.exists():
                raise FileNotFoundError(f"Directory not found: {directory_path}")
            
            if not path.is_dir():
                raise NotADirectoryError(f"Path is not a directory: {directory_path}")
            
            items = []
            for item in path.iterdir():
                item_info = self._get_item_info(item)
                items.append(item_info)
            
            return {
                'path': str(path.absolute()),
                'items': sorted(items, key=lambda x: (x['type'] != 'directory', x['name'].lower()))
            }
            
        except Exception as e:
            raise Exception(f"Failed to list directory: {str(e)}")
    
    def get_metadata(self, file_path: str) -> Dict[str, Any]:
        """Get file metadata"""
        try:
            path = Path(file_path)
            if not path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            return self._get_item_info(path)
            
        except Exception as e:
            raise Exception(f"Failed to get metadata: {str(e)}")
    
    def _get_item_info(self, path: Path) -> Dict[str, Any]:
        """Get detailed information about a file or directory"""
        try:
            stat_info = path.stat()
            
            item_info = {
                'name': path.name,
                'path': str(path.absolute()),
                'type': 'directory' if path.is_dir() else 'file',
                'size': stat_info.st_size,
                'modified': stat_info.st_mtime,
                'permissions': stat.filemode(stat_info.st_mode)
            }
            
            if path.is_file():
                item_info['extension'] = path.suffix.lower()
                item_info['is_image'] = self._is_supported_image(path)
                
                # Special handling for RAW files
                if self._is_raw_file(path):
                    item_info['raw_info'] = self._analyze_raw_file(path)
            
            return item_info
            
        except Exception as e:
            return {
                'name': path.name,
                'path': str(path.absolute()),
                'error': str(e)
            }
    
    def _is_supported_image(self, path: Path) -> bool:
        """Check if file is a supported image format"""
        return path.suffix.lower() in self.SUPPORTED_IMAGE_EXTENSIONS
    
    def _is_raw_file(self, path: Path) -> bool:
        """Check if file is a RAW image file"""
        return path.suffix.lower() == '.raw'
    
    def _analyze_raw_file(self, path: Path) -> Dict[str, Any]:
        """Analyze RAW file to determine dimensions"""
        try:
            file_size = path.stat().st_size
            
            # Check for 327,680 bytes (640x512)
            if file_size == 327680:
                return {
                    'width': 640,
                    'height': 512,
                    'type': 'grayscale',
                    'valid': True
                }
            
            # Check for perfect square
            import math
            sqrt_size = int(math.sqrt(file_size))
            if sqrt_size * sqrt_size == file_size:
                return {
                    'width': sqrt_size,
                    'height': sqrt_size,
                    'type': 'grayscale',
                    'valid': True
                }
            
            return {
                'valid': False,
                'reason': f'File size {file_size} is not 327,680 bytes or a perfect square'
            }
            
        except Exception as e:
            return {
                'valid': False,
                'reason': f'Error analyzing RAW file: {str(e)}'
            }