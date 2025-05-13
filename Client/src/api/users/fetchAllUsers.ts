import apiClient from "@/api/apiClient";
import { User } from "@/types/api/user";

export const fetchAllUsers = async (): Promise<User | null> => {
  try {
    const { data } = await apiClient.get<User>("/users");
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    return null;
  }
};
