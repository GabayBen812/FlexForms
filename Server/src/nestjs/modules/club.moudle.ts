import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClubService } from '../services/clubs.service';
import { ClubController } from '../controllers/clubs.controller';
import { Club, ClubSchema } from '../schemas/club.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Club.name, schema: ClubSchema }])],
  providers: [ClubService],
  controllers: [ClubController],
  exports: [ClubService],
})
export class clubModule {}
