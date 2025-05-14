import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeatureFlag, FeatureFlagSchema } from '../schemas/feature-flag.schema';
import { FeatureFlagController } from '../controllers/feature-flag.controller';
import { FeatureFlagService } from '../services/feature-flag.service';
import { Organization, OrganizationSchema } from '../schemas/organization.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeatureFlag.name, schema: FeatureFlagSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ])
  ],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService],
  exports: [FeatureFlagService]
})
export class FeatureFlagModule {} 