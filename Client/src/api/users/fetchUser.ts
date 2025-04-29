import apiClient from "@/api/apiClient";
import { User } from "@/types/api/user";

export const fetchUser = async (): Promise<User | null> => {
  try {
    const { data } = await apiClient.get<User>("/users/find");
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};
