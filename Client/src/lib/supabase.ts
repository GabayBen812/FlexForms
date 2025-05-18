import { storage } from "./firebase";
import { getDownloadURL, ref } from "firebase/storage";

/**
 * Returns a Promise that resolves to the download URL for an image in Firebase Storage.
 * @param path The path to the image in Firebase Storage.
 */
export function getImage(path: string): Promise<string> {
  const imageRef = ref(storage, path);
  return getDownloadURL(imageRef);
} 