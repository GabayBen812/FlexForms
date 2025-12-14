import apiClient from "@/api/apiClient";
import { User } from "@/types/users/user";

export const fetchUser = async (): Promise<User | null> => {
  try {
    console.log("🔄 Fetching user from /auth/user...");
    console.log("🍪 Current cookies:", document.cookie);
    const { data } = await apiClient.get("/auth/user");
    console.log("✅ USER FROM JWT:", data);
    return data;
  } catch (error: any) {
    console.error("❌ Error fetching user:", error);
    console.error("❌ Error response:", error.response?.data);
    console.error("❌ Error status:", error.response?.status);
    console.error("🍪 Cookies when error occurred:", document.cookie);
    return null;
  }
};
