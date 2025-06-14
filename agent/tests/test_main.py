import unittest
import sys
import os
from unittest.mock import patch, MagicMock
import json

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import execute_command


class TestMain(unittest.TestCase):
    
    @patch('main.FileManager')
    def test_execute_command_list(self, mock_file_manager_class):
        """Test execute_command with 'list' command"""
        mock_file_manager = MagicMock()
        mock_file_manager_class.return_value = mock_file_manager
        mock_file_manager.list_directory.return_value = {
            'path': '/test/path',
            'items': []
        }
        
        result = execute_command('list', '/test/path')
        
        mock_file_manager.list_directory.assert_called_once_with('/test/path')
        self.assertEqual(result, {'path': '/test/path', 'items': []})
    
    @patch('main.ImageProcessor')
    def test_execute_command_thumbnail(self, mock_image_processor_class):
        """Test execute_command with 'thumbnail' command"""
        mock_image_processor = MagicMock()
        mock_image_processor_class.return_value = mock_image_processor
        mock_image_processor.create_thumbnail.return_value = {
            'success': True,
            'thumbnail_base64': 'fake_base64_data'
        }
        
        result = execute_command('thumbnail', '/test/image.jpg', '/test/output.jpg')
        
        mock_image_processor.create_thumbnail.assert_called_once_with('/test/image.jpg', '/test/output.jpg')
        self.assertEqual(result, {'success': True, 'thumbnail_base64': 'fake_base64_data'})
    
    @patch('main.FileManager')
    def test_execute_command_metadata(self, mock_file_manager_class):
        """Test execute_command with 'metadata' command"""
        mock_file_manager = MagicMock()
        mock_file_manager_class.return_value = mock_file_manager
        mock_file_manager.get_metadata.return_value = {
            'name': 'test.jpg',
            'size': 1024,
            'type': 'file'
        }
        
        result = execute_command('metadata', '/test/image.jpg')
        
        mock_file_manager.get_metadata.assert_called_once_with('/test/image.jpg')
        self.assertEqual(result, {'name': 'test.jpg', 'size': 1024, 'type': 'file'})
    
    def test_execute_command_unknown(self):
        """Test execute_command with unknown command"""
        with self.assertRaises(ValueError) as context:
            execute_command('unknown_command', '/test/path')
        
        self.assertIn('Unknown command: unknown_command', str(context.exception))


if __name__ == '__main__':
    unittest.main()