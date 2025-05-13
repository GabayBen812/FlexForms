import { decryptData } from "@/lib/crypto-js";

export function getDecryptedData<T>(
  searchKey: string,
  locationSearch: string
): T | null {
  const searchParams = new URLSearchParams(locationSearch);
  const encryptedData = searchParams.get(searchKey);

  if (!encryptedData) {
    return null;
  }

  try {
    return decryptData(encryptedData) as T;
  } catch (error) {
    console.error("Error decrypting data:", error);
    return null;
  }
}
