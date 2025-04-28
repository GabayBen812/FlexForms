import { deleteImage, getImage, uploadImage } from "./supabase";

export const handleLogoUpload = async (
  logo: File,
  path: string
): Promise<string> => {
  const uuid = crypto.randomUUID();
  const fullPath = `${path}/${uuid}.png`;

  const uploadedPath = await uploadImage(logo, fullPath);

  if (!uploadedPath) {
    console.log("Failed to upload image");
    return "";
  }

  return uploadedPath;
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
    if (!isCreateMode && oldImage && deleteImage) await deleteImage(oldImage);

    return getImage(newPath);
  } else if (!isCreateMode && newImage === oldImage) {
    return oldImage;
  }
  return newImage;
};
