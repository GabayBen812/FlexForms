import { Organization } from "./organization";
import { User } from "./user";

export interface LoginCredentials {
  email: string;
  password: string;
}

export type MutationResponse<T = unknown> = {
  status: number; // HTTP status code
  data?: T; // Typed data when successful
  error?: string; // Error message if there's an error
};

export type LoginResponse = {
  accessToken: string; // JWT token
  user: User;
  organization: Organization;
};
