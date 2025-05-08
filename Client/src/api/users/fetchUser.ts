import apiClient from "@/api/apiClient";
import { User } from "@/types/users/user";

export const fetchUser = async (): Promise<User | null> => {
  try {
    const { data } = await apiClient.get("/auth/user");
    console.log("✅ USER FROM JWT:", data);
    return data;
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return null;
  }
};
