import { Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Registration, RegistrationDocument } from '../schemas/registration.schema';
import { CreateRegistrationDto } from '../dto/registration.dto';
import { EmailService } from './email.service';
import { FormService } from './form.service';
import { UserService } from './user.service';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectModel(Registration.name) private model: Model<RegistrationDocument>,
    private readonly emailService: EmailService,
    private readonly formService: FormService,
    private readonly userService: UserService
  ) {}

  async create(data: CreateRegistrationDto) {
    try {
      const formId = new Types.ObjectId(data.formId);
      const organizationId = new Types.ObjectId(data.organizationId);

      const registration: any = {
        formId,
        organizationId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        additionalData: data.additionalData || {},
      };

      // Add kidId if provided
      if (data.kidId) {
        registration.kidId = new Types.ObjectId(data.kidId);
      }

      const result = await this.model.create(registration);

      // Send email notifications asynchronously (don't block registration)
      this.sendRegistrationEmails(result, data).catch((err) => {
        console.error('Error sending registration emails:', err);
      });

      return result;
    } catch (err) {
      console.error("Error while saving registration:", err);
      throw err;
    }
  }

  private async sendRegistrationEmails(registration: RegistrationDocument, data: CreateRegistrationDto) {
    try {
      // Get form details
      const form = await this.formService.findById(String(data.formId));
      const formName = form?.title || 'Form';

      // Get organization admin to notify
      const adminUser = await this.userService.findSystemAdminByOrganization(String(data.organizationId));

      // Prepare submission data
      const submissionData: Record<string, unknown> = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        ...data.additionalData,
      };

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const submissionUrl = `${frontendUrl}/forms/registrations/${registration._id}`;

      // Send notification to admin
      if (adminUser && adminUser.email) {
        await this.emailService.sendFormSubmissionNotification({
          recipientEmail: adminUser.email,
          recipientName: adminUser.name,
          formName,
          submitterName: data.fullName,
          submitterEmail: data.email,
          submissionData,
          submissionUrl,
          language: 'he',
        });
      }

      // Send confirmation to submitter (optional)
      if (data.email) {
        // You can add a confirmation email here if needed
      }
    } catch (err) {
      console.error('Error in sendRegistrationEmails:', err);
    }
  }

  async findByFormId(formId: string) {
    return this.model.find({ formId: new Types.ObjectId(formId) }).exec();
  }

  async findAll(query: any = {}) {
    const filter: any = {};
    // Global search (search input)
    if (query.search) {
      filter.fullName = { $regex: query.search, $options: 'i' };
    }
    // Advanced search (field-specific)
    if (query.fullName) {
      filter.fullName = { $regex: query.fullName, $options: 'i' };
    }
    if (query.email) {
      filter.email = { $regex: query.email, $options: 'i' };
    }
    if (query.phone) {
      filter.phone = { $regex: query.phone, $options: 'i' };
    }
    if (query.formId && Types.ObjectId.isValid(query.formId)) {
      filter.formId = new Types.ObjectId(query.formId);
    }
    if (query.organizationId && Types.ObjectId.isValid(query.organizationId)) {
      filter.organizationId = new Types.ObjectId(query.organizationId);
    }
    // Support filtering on additionalData fields (dot notation)
    Object.keys(query).forEach(key => {
      if (key.startsWith('additionalData.') && query[key]) {
        filter[key] = { $regex: query[key], $options: 'i' };
      }
    });
    // Remove empty filters
    Object.keys(filter).forEach(key => {
      if (filter[key] === undefined || filter[key] === "") {
        delete filter[key];
      }
    });
    return this.model.find(filter).exec();
  }

  async findPaginatedWithFilters(query: any, skip: number, limit: number) {
    const filter: any = {};
    // Global search (search input)
    if (query.search) {
      filter.fullName = { $regex: query.search, $options: 'i' };
    }
    // Advanced search (field-specific)
    if (query.fullName) {
      filter.fullName = { $regex: query.fullName, $options: 'i' };
    }
    if (query.email) {
      filter.email = { $regex: query.email, $options: 'i' };
    }
    if (query.phone) {
      filter.phone = { $regex: query.phone, $options: 'i' };
    }
    if (query.formId && Types.ObjectId.isValid(query.formId)) {
      filter.formId = new Types.ObjectId(query.formId);
    }
    if (query.organizationId && Types.ObjectId.isValid(query.organizationId)) {
      filter.organizationId = new Types.ObjectId(query.organizationId);
    }
    Object.keys(query).forEach(key => {
      if (key.startsWith('additionalData.') && query[key]) {
        filter[key] = { $regex: query[key], $options: 'i' };
      }
    });
    Object.keys(filter).forEach(key => {
      if (filter[key] === undefined || filter[key] === "") {
        delete filter[key];
      }
    });
    
    // Handle sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };
    
    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return [data, total];
  }

  async countNumOfRegisteringByFormIds(formIds: string[], organizationId?: string) {
    // Filter out invalid ObjectIds
    const validIds = formIds
      .filter(id => id && id.trim() !== '')
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    if (validIds.length === 0) {
      return {};
    }

    const matchStage: any = { formId: { $in: validIds } };
    
    // CRITICAL: Filter by organizationId in multi-tenant system
    if (organizationId && Types.ObjectId.isValid(organizationId)) {
      matchStage.organizationId = new Types.ObjectId(organizationId);
    }

    const result = await this.model.aggregate([
      { $match: matchStage },
      { $group: { _id: '$formId', count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = {};
    result.forEach(entry => {
      counts[entry._id.toString()] = entry.count;
    });
    
    return counts;
  }

  async deleteMany(ids: (string | number)[]) {
    const objectIds = ids.map(id => new Types.ObjectId(String(id)));
    const result = await this.model.deleteMany({ _id: { $in: objectIds } });
    return { 
      status: 200,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} registration(s)`
    };
  }

}

