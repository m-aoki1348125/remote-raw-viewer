#!/usr/bin/env python3
"""
Remote Raw Viewer Agent
Main CLI entry point for remote server operations
"""

import argparse
import json
import sys
from typing import Dict, Any
from file_manager import FileManager
from image_processor import ImageProcessor


def main():
    parser = argparse.ArgumentParser(description='Remote Raw Viewer Agent')
    parser.add_argument('command', choices=['list', 'thumbnail', 'metadata'], 
                       help='Command to execute')
    parser.add_argument('--path', required=True, help='File or directory path')
    parser.add_argument('--output', help='Output file path (optional)')
    
    args = parser.parse_args()
    
    try:
        result = execute_command(args.command, args.path, args.output)
        print(json.dumps(result, indent=2))
        return 0
    except Exception as e:
        print(json.dumps({'error': str(e)}, indent=2), file=sys.stderr)
        return 1


def execute_command(command: str, path: str, output: str = None) -> Dict[str, Any]:
    """Execute the specified command and return results"""
    
    file_manager = FileManager()
    image_processor = ImageProcessor()
    
    if command == 'list':
        return file_manager.list_directory(path)
    elif command == 'thumbnail':
        return image_processor.create_thumbnail(path, output)
    elif command == 'metadata':
        return file_manager.get_metadata(path)
    else:
        raise ValueError(f"Unknown command: {command}")


if __name__ == '__main__':
    sys.exit(main())