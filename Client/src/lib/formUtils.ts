import { handleImageUpload } from "./imageUtils";

// import { deleteImage, getImage, uploadImage } from "./supabase";

export const handleLogoUpload = async (
  logo: File,
  path: string
): Promise<string> => {
  try {
    const uploadedPath = await handleImageUpload(logo, path);
    return uploadedPath;
  } catch (error) {
    console.error("Failed to upload image:", error);
    return "";
  }
};

type ImageHandlerOptions = {
  newImage: any;
  oldImage?: string;
  isCreateMode: boolean;
  path: string;
};

export const handleImageChange = async ({
  newImage,
  oldImage,
  isCreateMode,
  path,
}: ImageHandlerOptions): Promise<string | undefined> => {
  if (newImage && (isCreateMode || newImage !== oldImage)) {
    const newPath = await handleLogoUpload(newImage, path);
    // if (!isCreateMode && oldImage && deleteImage) await deleteImage(oldImage);

    return "";
  } else if (!isCreateMode && newImage === oldImage) {
    return oldImage;
  }
  return newImage;
};
