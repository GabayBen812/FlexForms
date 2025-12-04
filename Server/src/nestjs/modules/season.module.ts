import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeasonController } from '../controllers/season.controller';
import { SeasonService } from '../services/season.service';
import { Season, SeasonSchema } from '../schemas/season.schema';
import { Organization, OrganizationSchema } from '../schemas/organization.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Season.name, schema: SeasonSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [SeasonController],
  providers: [SeasonService],
  exports: [SeasonService],
})
export class SeasonModule {}

