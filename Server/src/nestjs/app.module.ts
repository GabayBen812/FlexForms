import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './controllers/auth.controller';
import { UserModule } from './modules/user.module';
import { AuthService } from './services/auth.service';
import * as dotenv from 'dotenv';
import { FormModule } from './modules/form.module';
import { RequestModule } from './modules/request.moudle';
import { AuthModule } from './modules/auth.module';
import { OrganizationModule } from './modules/organization.module';
import { PaymentModule } from './modules/payment.module';
import { RegistrationModule } from './modules/registration.module';
import { clubModule } from './modules/club.moudle';
import { AccountModule } from './modules/account.module';
import { FeatureFlagModule } from './modules/feature-flag.module';
import { RoomModule } from './modules/room.module';
import { KidModule } from './modules/kid.module';
import { ParentModule } from './modules/parent.module';
import { EmployeeModule } from './modules/employee.module';
import { TaskModule } from './modules/task.module';
import { ChatModule } from './modules/chat.module';
import { HealthController } from './controllers/health.controller';
import { AnalyticsModule } from './modules/analytics.module';
import { ContactModule } from './modules/contact.module';
import { AttendanceModule } from './modules/attendance.module';
import { ExpenseModule } from './modules/expense.module';
import { InvoiceModule } from './modules/invoice.module';
import { EmailModule } from './modules/email.module';
import { CourseModule } from './modules/course.module';
import { CourseAttendanceModule } from './modules/course-attendance.module';
dotenv.config();
@Module({
  imports: [
    MongooseModule.forRoot((process.env.MONGODB_URI || '').trim()),
    AuthModule,
    FormModule,
    RequestModule,
    UserModule,
    OrganizationModule,
    PaymentModule,
    RegistrationModule,
    clubModule,
    AccountModule,
    FeatureFlagModule,
    RoomModule,
    KidModule,
    ParentModule,
    EmployeeModule,
    TaskModule,
    ChatModule,
    AnalyticsModule,
    ContactModule,
    AttendanceModule,
    ExpenseModule,
    InvoiceModule,
    EmailModule,
    CourseModule,
    CourseAttendanceModule
  ],
  controllers: [AuthController, HealthController],
  providers: [AuthService],
})
export class AppModule {}
