"""
Image Processor Module
Handles image processing and thumbnail generation
"""

import os
import io
import base64
from typing import Dict, Any, Optional
from pathlib import Path
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ImageProcessor:
    """Handles image processing operations"""
    
    THUMBNAIL_SIZE = (200, 200)
    SUPPORTED_FORMATS = {'JPEG', 'PNG', 'GIF', 'WEBP', 'BMP', 'TIFF'}
    
    def create_thumbnail(self, image_path: str, output_path: Optional[str] = None) -> Dict[str, Any]:
        """Create thumbnail for an image file"""
        try:
            path = Path(image_path)
            if not path.exists():
                raise FileNotFoundError(f"Image file not found: {image_path}")
            
            # Handle RAW files
            if path.suffix.lower() == '.raw':
                return self._process_raw_image(path, output_path)
            
            # Handle standard image formats
            return self._process_standard_image(path, output_path)
            
        except Exception as e:
            logger.error(f"Failed to create thumbnail for {image_path}: {str(e)}")
            raise Exception(f"Thumbnail creation failed: {str(e)}")
    
    def _process_standard_image(self, path: Path, output_path: Optional[str] = None) -> Dict[str, Any]:
        """Process standard image formats"""
        try:
            with Image.open(path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Create thumbnail
                img.thumbnail(self.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
                
                # Save or return as base64
                if output_path:
                    img.save(output_path, 'JPEG', quality=85)
                    return {
                        'success': True,
                        'output_path': output_path,
                        'thumbnail_size': img.size,
                        'original_size': Image.open(path).size
                    }
                else:
                    # Return as base64 encoded string
                    buffer = io.BytesIO()
                    img.save(buffer, format='JPEG', quality=85)
                    thumbnail_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    
                    return {
                        'success': True,
                        'thumbnail_base64': thumbnail_b64,
                        'thumbnail_size': img.size,
                        'original_size': Image.open(path).size
                    }
                    
        except Exception as e:
            raise Exception(f"Standard image processing failed: {str(e)}")
    
    def _process_raw_image(self, path: Path, output_path: Optional[str] = None) -> Dict[str, Any]:
        """Process RAW image files"""
        try:
            file_size = path.stat().st_size
            
            # Determine dimensions
            width, height = self._get_raw_dimensions(file_size)
            if width is None or height is None:
                logger.warning(f"Skipping invalid RAW file: {path} (size: {file_size})")
                return {
                    'success': False,
                    'error': f'Invalid RAW file size: {file_size} bytes (not 327,680 or perfect square)'
                }
            
            # Read raw data
            with open(path, 'rb') as f:
                raw_data = f.read()
            
            # Validate data length matches expected size
            expected_size = width * height
            if len(raw_data) != expected_size:
                logger.error(f"RAW data size mismatch: expected {expected_size}, got {len(raw_data)}")
                return {
                    'success': False,
                    'error': f'RAW data size mismatch: expected {expected_size} bytes, got {len(raw_data)} bytes'
                }
            
            # Create PIL Image from raw grayscale data
            try:
                img = Image.frombytes('L', (width, height), raw_data)
            except Exception as e:
                logger.error(f"Failed to create image from RAW data: {str(e)}")
                return {
                    'success': False,
                    'error': f'Failed to interpret RAW data: {str(e)}'
                }
            
            # Create thumbnail
            original_size = img.size
            img.thumbnail(self.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
            
            # Convert to RGB for JPEG output
            img = img.convert('RGB')
            
            # Save or return as base64
            if output_path:
                img.save(output_path, 'JPEG', quality=85)
                return {
                    'success': True,
                    'output_path': output_path,
                    'thumbnail_size': img.size,
                    'original_size': original_size,
                    'raw_info': {
                        'width': width, 
                        'height': height, 
                        'type': 'grayscale',
                        'file_size': file_size,
                        'is_640x512': file_size == 327680,
                        'is_square': width == height
                    }
                }
            else:
                # Return as base64 encoded string
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=85)
                thumbnail_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                return {
                    'success': True,
                    'thumbnail_base64': thumbnail_b64,
                    'thumbnail_size': img.size,
                    'original_size': original_size,
                    'raw_info': {
                        'width': width, 
                        'height': height, 
                        'type': 'grayscale',
                        'file_size': file_size,
                        'is_640x512': file_size == 327680,
                        'is_square': width == height
                    }
                }
                
        except Exception as e:
            logger.error(f"RAW image processing failed for {path}: {str(e)}")
            return {
                'success': False,
                'error': f"RAW image processing failed: {str(e)}"
            }
    
    def _get_raw_dimensions(self, file_size: int) -> tuple[Optional[int], Optional[int]]:
        """Determine RAW image dimensions based on file size"""
        # Check for 327,680 bytes (640x512)
        if file_size == 327680:
            return 640, 512
        
        # Check for perfect square
        import math
        sqrt_size = int(math.sqrt(file_size))
        if sqrt_size * sqrt_size == file_size:
            return sqrt_size, sqrt_size
        
        # Invalid size
        return None, None