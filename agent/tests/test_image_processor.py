import unittest
import tempfile
import os
from pathlib import Path
import sys

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from image_processor import ImageProcessor


class TestImageProcessor(unittest.TestCase):
    def setUp(self):
        self.processor = ImageProcessor()
        self.temp_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        # Clean up temp directory
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_get_raw_dimensions_327680_bytes(self):
        """Test RAW dimensions calculation for 327,680 bytes"""
        width, height = self.processor._get_raw_dimensions(327680)
        self.assertEqual(width, 640)
        self.assertEqual(height, 512)
    
    def test_get_raw_dimensions_perfect_square(self):
        """Test RAW dimensions calculation for perfect square"""
        # 100x100 = 10,000 bytes
        width, height = self.processor._get_raw_dimensions(10000)
        self.assertEqual(width, 100)
        self.assertEqual(height, 100)
        
        # 256x256 = 65,536 bytes
        width, height = self.processor._get_raw_dimensions(65536)
        self.assertEqual(width, 256)
        self.assertEqual(height, 256)
    
    def test_get_raw_dimensions_invalid_size(self):
        """Test RAW dimensions calculation for invalid size"""
        width, height = self.processor._get_raw_dimensions(1234)
        self.assertIsNone(width)
        self.assertIsNone(height)
    
    def test_create_thumbnail_nonexistent_file(self):
        """Test thumbnail creation for non-existent file"""
        with self.assertRaises(Exception) as context:
            self.processor.create_thumbnail('/nonexistent/image.jpg')
        self.assertIn('Image file not found', str(context.exception))
    
    def test_process_raw_image_invalid_size(self):
        """Test processing RAW image with invalid size"""
        raw_file = Path(self.temp_dir) / 'invalid.raw'
        raw_file.write_bytes(b'x' * 1234)  # Invalid size
        
        result = self.processor._process_raw_image(raw_file)
        self.assertFalse(result['success'])
        self.assertIn('Invalid RAW file size', result['error'])
    
    def test_process_raw_image_valid_640x512(self):
        """Test processing valid 640x512 RAW image"""
        raw_file = Path(self.temp_dir) / 'valid.raw'
        # Create test RAW data (640x512 grayscale)
        raw_data = bytes(range(256)) * (327680 // 256)  # Create pattern
        raw_file.write_bytes(raw_data)
        
        result = self.processor._process_raw_image(raw_file)
        self.assertTrue(result['success'])
        self.assertEqual(result['original_size'], (640, 512))
        self.assertIn('thumbnail_base64', result)
        self.assertIn('raw_info', result)
        self.assertEqual(result['raw_info']['width'], 640)
        self.assertEqual(result['raw_info']['height'], 512)
    
    def test_process_raw_image_valid_square(self):
        """Test processing valid square RAW image"""
        raw_file = Path(self.temp_dir) / 'square.raw'
        # Create 100x100 test RAW data
        raw_data = bytes(range(256)) * (10000 // 256)
        raw_file.write_bytes(raw_data)
        
        result = self.processor._process_raw_image(raw_file)
        self.assertTrue(result['success'])
        self.assertEqual(result['original_size'], (100, 100))
        self.assertIn('thumbnail_base64', result)
        self.assertEqual(result['raw_info']['width'], 100)
        self.assertEqual(result['raw_info']['height'], 100)


if __name__ == '__main__':
    unittest.main()