import { SetMetadata } from '@nestjs/common';
import { FEATURE_FLAG_KEY } from './feature-flag.guard';

export const FeatureFlag = (flag: string) => SetMetadata(FEATURE_FLAG_KEY, flag); 