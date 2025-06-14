import unittest
import tempfile
import os
from pathlib import Path
import sys

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from file_manager import FileManager


class TestFileManager(unittest.TestCase):
    def setUp(self):
        self.file_manager = FileManager()
        self.temp_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        # Clean up temp directory
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_list_nonexistent_directory(self):
        """Test listing a non-existent directory raises FileNotFoundError"""
        with self.assertRaises(Exception) as context:
            self.file_manager.list_directory('/nonexistent/directory')
        self.assertIn('Directory not found', str(context.exception))
    
    def test_list_empty_directory(self):
        """Test listing an empty directory"""
        result = self.file_manager.list_directory(self.temp_dir)
        self.assertEqual(result['items'], [])
        self.assertEqual(result['path'], str(Path(self.temp_dir).absolute()))
    
    def test_list_directory_with_files(self):
        """Test listing directory with files"""
        # Create test files
        test_file = Path(self.temp_dir) / 'test.txt'
        test_file.write_text('test content')
        
        test_image = Path(self.temp_dir) / 'test.jpg'
        test_image.write_bytes(b'fake image data')
        
        result = self.file_manager.list_directory(self.temp_dir)
        self.assertEqual(len(result['items']), 2)
        
        # Check file properties
        for item in result['items']:
            self.assertIn('name', item)
            self.assertIn('type', item)
            self.assertIn('size', item)
            self.assertEqual(item['type'], 'file')
    
    def test_get_metadata_nonexistent_file(self):
        """Test getting metadata for non-existent file"""
        with self.assertRaises(Exception) as context:
            self.file_manager.get_metadata('/nonexistent/file.txt')
        self.assertIn('File not found', str(context.exception))
    
    def test_is_supported_image(self):
        """Test image format detection"""
        test_cases = [
            ('test.jpg', True),
            ('test.png', True),
            ('test.gif', True),
            ('test.webp', True),
            ('test.raw', True),
            ('test.txt', False),
            ('test.doc', False)
        ]
        
        for filename, expected in test_cases:
            path = Path(filename)
            result = self.file_manager._is_supported_image(path)
            self.assertEqual(result, expected, f"Failed for {filename}")
    
    def test_analyze_raw_file_327680_bytes(self):
        """Test RAW file analysis for 327,680 bytes (640x512)"""
        raw_file = Path(self.temp_dir) / 'test.raw'
        raw_file.write_bytes(b'x' * 327680)  # 640 * 512 = 327,680 bytes
        
        result = self.file_manager._analyze_raw_file(raw_file)
        self.assertTrue(result['valid'])
        self.assertEqual(result['width'], 640)
        self.assertEqual(result['height'], 512)
        self.assertEqual(result['type'], 'grayscale')
    
    def test_analyze_raw_file_perfect_square(self):
        """Test RAW file analysis for perfect square"""
        # 100x100 = 10,000 bytes
        raw_file = Path(self.temp_dir) / 'square.raw'
        raw_file.write_bytes(b'x' * 10000)
        
        result = self.file_manager._analyze_raw_file(raw_file)
        self.assertTrue(result['valid'])
        self.assertEqual(result['width'], 100)
        self.assertEqual(result['height'], 100)
        self.assertEqual(result['type'], 'grayscale')
    
    def test_analyze_raw_file_invalid_size(self):
        """Test RAW file analysis for invalid size"""
        raw_file = Path(self.temp_dir) / 'invalid.raw'
        raw_file.write_bytes(b'x' * 1234)  # Invalid size
        
        result = self.file_manager._analyze_raw_file(raw_file)
        self.assertFalse(result['valid'])
        self.assertIn('not 327,680 bytes or a perfect square', result['reason'])


if __name__ == '__main__':
    unittest.main()