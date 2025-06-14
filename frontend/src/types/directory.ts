export interface DirectoryItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: number;
  isImage?: boolean;
  extension?: string;
  permissions?: string;
}

export interface DirectoryListing {
  path: string;
  items: DirectoryItem[];
}

export interface ImageListing {
  path: string;
  images: DirectoryItem[];
}

export interface ThumbnailData {
  success: boolean;
  thumbnail_base64?: string;
  error?: string;
  thumbnail_size?: [number, number];
  original_size?: [number, number];
}