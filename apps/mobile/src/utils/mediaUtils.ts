import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export type MediaAsset = {
  uri: string;
  type: 'image' | 'video';
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
};

/**
 * Request camera permissions
 */
export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Launch camera to take a photo
 */
export async function takePictureAsync(): Promise<MediaAsset | null> {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
    aspect: [4, 3],
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    type: 'image',
    fileName: asset.fileName,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
  };
}

/**
 * Launch image picker to select from gallery
 */
export async function pickImageAsync(
  allowsMultiple: boolean = false
): Promise<MediaAsset[]> {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) {
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultiple,
    quality: 0.8,
    allowsEditing: !allowsMultiple,
  });

  if (result.canceled || !result.assets) {
    return [];
  }

  return result.assets.map((asset) => ({
    uri: asset.uri,
    type: asset.type === 'video' ? 'video' : 'image',
    fileName: asset.fileName,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
  }));
}

/**
 * Compress an image for uploading
 * Reduces size while maintaining quality
 */
export async function compressImage(
  uri: string,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.7
): Promise<string> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return manipResult.uri;
  } catch (error) {
    // If compression fails, return original URI
    return uri;
  }
}

/**
 * Get file extension from URI
 */
export function getFileExtension(uri: string): string {
  const match = uri.match(/\.([^./?]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : 'jpg';
}

/**
 * Generate a filename for an image
 */
export function generateImageFileName(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `image_${timestamp}_${random}.jpg`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}





