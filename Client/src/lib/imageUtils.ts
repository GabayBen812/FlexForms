import { storage } from "./firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export const uploadImage = async (
  file: File | string,
  path: string
): Promise<string> => {
  try {
    console.log(`[uploadImage] Starting upload for path: ${path}`);

    // Create a storage reference
    const storageRef = ref(storage, path);
    console.log("[uploadImage] Storage reference created");

    let dataUrl: string;

    // If file is already a data URL
    if (typeof file === "string" && file.startsWith("data:")) {
      dataUrl = file;
    } else if (file instanceof File) {
      // Convert File to data URL
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    } else {
      throw new Error("Invalid file format");
    }

    // Upload the data URL
    const snapshot = await uploadString(storageRef, dataUrl, "data_url");
    console.log("[uploadImage] File uploaded successfully");

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("[uploadImage] Download URL obtained:", downloadURL);

    return downloadURL;
  } catch (error) {
    console.error("[uploadImage] Error uploading image:", error);
    // If we have base64 data, return it as fallback
    if (typeof file === "string" && file.startsWith("data:")) {
      console.log("[uploadImage] Falling back to base64 data");
      return file;
    }
    throw error;
  }
};

export const handleImageUpload = async (
  file: File | string,
  path: string
): Promise<string> => {
  try {
    // Generate a unique path
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const fullPath = `signatures/${timestamp}_${uuid}`;

    console.log(`[handleImageUpload] Processing file with path: ${fullPath}`);

    // Upload the image
    const downloadURL = await uploadImage(file, fullPath);
    console.log("[handleImageUpload] Upload completed successfully");

    return downloadURL;
  } catch (error) {
    console.error("[handleImageUpload] Error:", error);
    // If we have base64 data, return it as fallback
    if (typeof file === "string" && file.startsWith("data:")) {
      console.log("[handleImageUpload] Falling back to base64 data");
      return file;
    }
    throw error;
  }
};
