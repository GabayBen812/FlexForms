import { Request } from "express";

export interface JWTUserInfo {
  id: string;
  email: string;
}

export interface ExtendedRequest extends Request {
  user?: JWTUserInfo;
}
