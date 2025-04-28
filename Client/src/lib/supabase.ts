import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getImage = (fullPath: string) => {
  const { data } = supabase.storage.from("Images").getPublicUrl(fullPath);
  return data?.publicUrl || "";
};

export const deleteImage = (
  fullUrl: string,
  bucket = "Images"
): Promise<void> => {
  const match = fullUrl.match(
    new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`)
  );

  if (!match || !match[1]) {
    throw new Error("Invalid Supabase URL or mismatched bucket name.");
  }

  const relativePath = match[1]; // e.g. "1/departments/uuid.png"

  supabase.storage.from(bucket).remove([relativePath]);
  return Promise.resolve();
};

export const uploadImage = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from("Images")
    .upload(path, file, { cacheControl: "3600" });
  if (error) throw error;
  return data?.path || null;
};
