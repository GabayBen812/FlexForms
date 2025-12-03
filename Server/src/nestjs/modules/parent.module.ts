import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParentController } from '../controllers/parent.controller';
import { ParentService } from '../services/parent.service';
import { Parent, ParentSchema } from '../schemas/parent.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { KidModule } from './kid.module';
import { ContactModule } from './contact.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Parent.name, schema: ParentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => KidModule),
    ContactModule,
  ],
  controllers: [ParentController],
  providers: [ParentService],
  exports: [ParentService],
})
export class ParentModule {}

