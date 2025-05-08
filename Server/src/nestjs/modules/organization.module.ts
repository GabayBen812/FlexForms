import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from '../schemas/organization.schema';
import { OrganizationController } from '../controllers/organization.controller';
import { OrganizationService } from '../services/organization.service';

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService],
  imports: [MongooseModule.forFeature([{ name: Organization.name, schema: OrganizationSchema }])],
  exports: [OrganizationService],
})
export class OrganizationModule {}
