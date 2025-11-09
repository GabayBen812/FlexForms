import { supabase } from "./supabase";

/**
 * Uploads a file directly to Supabase Storage
 * @param file - File object to upload
 * @param path - Storage path where the file should be stored (format: "bucket-name/path/to/file")
 * @returns Promise resolving to the public URL
 */
export const uploadFile = async (
  file: File,
  path: string
): Promise<string> => {
  try {
    console.log(`[uploadFile] Starting upload for path: ${path}`);

    const [bucket, ...filePathParts] = path.split("/");
    const filePath = filePathParts.join("/");

    if (!bucket || !filePath) {
      throw new Error("Invalid path format. Expected format: 'bucket-name/path/to/file'");
    }


    const sanitizedPath = filePath
      .replace(/[^a-zA-Z0-9._/-]/g, "_")
      .replace(/\/+/g, "/")
      .replace(/^\/+|\/+$/g, "");

    console.log(`[uploadFile] Uploading to bucket: ${bucket}, path: ${sanitizedPath}`);
    console.log(`[uploadFile] File name: ${file.name}, size: ${file.size}, type: ${file.type}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(sanitizedPath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("[uploadFile] Supabase upload error:", error);
      console.error("[uploadFile] Error details:", {
        message: error.message,
        name: error.name,
      });
      throw new Error(
        error.message || 
        'Failed to upload file: Unknown error'
      );
    }

    console.log("[uploadFile] File uploaded successfully");

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(sanitizedPath);

    const publicUrl = urlData.publicUrl;
    console.log("[uploadFile] Public URL obtained:", publicUrl);

    return publicUrl;
  } catch (error: any) {
    console.error("[uploadFile] Error uploading file:", error);
    const errorMessage = error?.message || 
                        error?.error?.message || 
                        String(error) || 
                        "Unknown error occurred";
    console.error("[uploadFile] Error message:", errorMessage);
    throw new Error(`File upload failed: ${errorMessage}`);
  }
};

/**
 * Uploads an image file to Supabase Storage
 * Supports both File objects and data URLs (for backward compatibility)
 * @param file - File object or data URL string
 * @param path - Storage path where the file should be stored (format: "bucket-name/path/to/file")
 * @returns Promise resolving to the public URL
 */
export const uploadImage = async (
  file: File | string,
  path: string
): Promise<string> => {
  try {
    console.log(`[uploadImage] Starting upload for path: ${path}`);

    if (file instanceof File) {
      return await uploadFile(file, path);
    }


    if (typeof file === "string" && file.startsWith("data:")) {
      const response = await fetch(file);
      const blob = await response.blob();
      
      const fileFromBlob = new File([blob], "image", { type: blob.type });
      
      return await uploadFile(fileFromBlob, path);
    }

    throw new Error("Invalid file format. Expected File object or data URL.");
  } catch (error) {
    console.error("[uploadImage] Error uploading image:", error);
    throw error;
  }
};

/**
 * Handles image upload with automatic path generation
 * @param file - File object or data URL string
 * @param path - Optional custom path. If not provided, generates a unique path
 * @returns Promise resolving to the public URL
 */
export const handleImageUpload = async (
  file: File | string,
  path?: string
): Promise<string> => {
  try {
    // Generate a unique path if not provided
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const fullPath = path || `uploads/signatures/${timestamp}_${uuid}`;

    console.log(`[handleImageUpload] Processing file with path: ${fullPath}`);

    // Upload the image
    const downloadURL = await uploadImage(file, fullPath);
    console.log("[handleImageUpload] Upload completed successfully");

    return downloadURL;
  } catch (error) {
    console.error("[handleImageUpload] Error:", error);
    throw error;
  }
};
