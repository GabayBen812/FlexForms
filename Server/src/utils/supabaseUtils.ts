import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getImage = (fullPath: string) => {
  const { data } = supabase.storage.from("Images").getPublicUrl(fullPath);
  return data?.publicUrl || "";
};

export const deleteImage = (fullPath: string) =>
  supabase.storage.from("Images").remove([fullPath]);

export const uploadImage = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from("Images")
    .upload(path, file, { cacheControl: "3600" });
  if (error) throw error;
  return data?.path || null;
};
