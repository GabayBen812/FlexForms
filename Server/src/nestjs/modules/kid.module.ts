import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KidController } from '../controllers/kid.controller';
import { KidService } from '../services/kid.service';
import { Kid, KidSchema } from '../schemas/kid.schema';
import { ParentModule } from './parent.module';
import { ContactModule } from './contact.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Kid.name, schema: KidSchema }]),
    forwardRef(() => ParentModule),
    ContactModule,
  ],
  controllers: [KidController],
  providers: [KidService],
  exports: [KidService],
})
export class KidModule {}

