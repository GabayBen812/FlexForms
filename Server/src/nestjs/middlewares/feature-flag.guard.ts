import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const FEATURE_FLAG_KEY = 'featureFlag';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const flag = this.reflector.get<string>(FEATURE_FLAG_KEY, context.getHandler());
    // TODO: Implement your feature flag logic using the flag value
    return true; // allow for now
  }
} 