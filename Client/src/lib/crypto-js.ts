import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
export const encryptData = (data: unknown): string => {
  return encodeURIComponent(
    CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString()
  );
};

export const decryptData = (encryptedData: string): unknown => {
  try {
    const bytes = CryptoJS.AES.decrypt(
      decodeURIComponent(encryptedData),
      SECRET_KEY
    );
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Decryption failed", error);
    return null;
  }
};
