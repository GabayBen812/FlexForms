import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are not set. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

/**
 * Returns a Promise that resolves to the download URL for an image in Supabase Storage.
 * @param path The path to the image in Supabase Storage (format: "bucket-name/path/to/file").
 */
export async function getImage(path: string): Promise<string> {
  try {
    const [bucket, ...filePathParts] = path.split("/");
    const filePath = filePathParts.join("/");

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error getting image from Supabase:", error);
    throw error;
  }
} 