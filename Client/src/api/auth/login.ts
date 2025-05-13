import apiClient from "@/api/apiClient";
import { LoginCredentials } from "@/types/api/auth";

export const login = (credentials: LoginCredentials) =>
  apiClient.post("/auth/login", credentials, {
    withCredentials: true,
  });


  