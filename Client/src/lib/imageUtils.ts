import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    // Create a storage reference
    const storageRef = ref(storage, path);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const handleImageUpload = async (
  file: File,
  path: string
): Promise<string> => {
  try {
    // Generate a unique filename
    const uuid = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop();
    const fullPath = `${path}/${uuid}.${fileExtension}`;

    // Upload the image
    const downloadURL = await uploadImage(file, fullPath);

    if (!downloadURL) {
      throw new Error('Failed to upload image');
    }

    return downloadURL;
  } catch (error) {
    console.error('Error in handleImageUpload:', error);
    throw error;
  }
}; 