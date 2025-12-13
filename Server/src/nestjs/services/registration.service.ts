import { Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Registration, RegistrationDocument } from '../schemas/registration.schema';
import { CreateRegistrationDto } from '../dto/registration.dto';
import { EmailService } from './email.service';
import { FormService } from './form.service';
import { UserService } from './user.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { KidService } from './kid.service';
import { OrganizationService } from './organization.service';
import { generateRegistrationPdfHtml, RegistrationPdfData } from '../../utils/pdfTemplates/registrationTemplate';
import * as archiver from 'archiver';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectModel(Registration.name) private model: Model<RegistrationDocument>,
    private readonly emailService: EmailService,
    private readonly formService: FormService,
    private readonly userService: UserService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly kidService: KidService,
    private readonly organizationService: OrganizationService
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

  /**
   * Export registrations to PDF
   * @param registrationIds Array of registration IDs to export
   * @param language Language for PDF (en/he)
   * @param translations Translation strings for the PDF
   * @returns Object with buffer and filename
   */
  async exportToPdf(
    registrationIds: string[],
    language: 'en' | 'he',
    translations: RegistrationPdfData['translations']
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    if (!registrationIds || registrationIds.length === 0) {
      throw new Error('No registrations specified for export');
    }

    // Fetch all registrations
    const registrations = await this.model
      .find({ _id: { $in: registrationIds.map(id => new Types.ObjectId(id)) } })
      .lean()
      .exec();

    if (registrations.length === 0) {
      throw new Error('No registrations found');
    }

    // Generate PDFs for each registration
    const pdfBuffers: Array<{ buffer: Buffer; filename: string }> = [];

    for (const registration of registrations) {
      try {
        // Fetch form details
        const form = await this.formService.findById(registration.formId.toString());
        if (!form) {
          console.error(`Form not found for registration ${registration._id}`);
          continue;
        }

        // Fetch organization details
        let organization: any = null;
        try {
          organization = await this.organizationService.findById(
            registration.organizationId.toString()
          );
        } catch (err) {
          console.error('Error fetching organization:', err);
        }

        // Fetch kid details if linked
        let kid: any = null;
        if (registration.kidId) {
          try {
            kid = await this.kidService.findOne(registration.kidId.toString());
          } catch (err) {
            console.error('Error fetching kid:', err);
          }
        }

        // Extract payment details from additionalData
        const paymentDetails = registration.additionalData?.paymentDetails || null;

        // Prepare PDF data
        const pdfData: RegistrationPdfData = {
          form: {
            title: form.title,
            fields: (form.fields || []) as any,
          },
          registration: {
            _id: registration._id.toString(),
            fullName: registration.fullName,
            email: registration.email,
            phone: registration.phone,
            additionalData: registration.additionalData,
            createdAt: (registration as any).createdAt?.toString() || new Date().toISOString(),
          },
          kid: kid ? {
            firstname: kid.firstname,
            lastname: kid.lastname,
            idNumber: kid.idNumber,
            birthDate: kid.birthDate,
            gender: kid.gender,
            address: kid.address,
            profileImageUrl: kid.profileImageUrl,
            dynamicFields: kid.dynamicFields,
          } : undefined,
          organization: organization ? {
            name: organization.name,
            logo: organization.logo,
          } : undefined,
          paymentDetails: paymentDetails ? {
            cardOwnerName: paymentDetails.cardOwnerName,
            last4Digits: paymentDetails.last4Digits,
            amountPaid: paymentDetails.amountPaid,
            paymentDate: paymentDetails.paymentDate,
            lowProfileCode: paymentDetails.lowProfileCode,
          } : undefined,
          language,
          translations,
        };

        // Generate HTML from template
        const html = generateRegistrationPdfHtml(pdfData);

        // Generate PDF from HTML
        const pdfBuffer = await this.pdfGeneratorService.generatePdfFromHtml(html);

        // Create filename - use only ASCII characters and replace spaces/special chars
        const sanitizedFormTitle = form.title
          .replace(/[^a-zA-Z0-9]/g, '_')
          .substring(0, 50); // Limit length
        const sanitizedName = (registration.fullName || 'registration')
          .replace(/[^a-zA-Z0-9]/g, '_')
          .substring(0, 30); // Limit length
        const timestamp = Date.now();
        const filename = `${sanitizedFormTitle}_${sanitizedName}_${timestamp}.pdf`;

        pdfBuffers.push({ buffer: pdfBuffer, filename });
      } catch (err) {
        console.error(`Error generating PDF for registration ${registration._id}:`, err);
        // Continue with other registrations
      }
    }

    if (pdfBuffers.length === 0) {
      throw new Error('Failed to generate any PDFs');
    }

    // If single PDF, return it directly
    if (pdfBuffers.length === 1) {
      return {
        buffer: pdfBuffers[0].buffer,
        filename: pdfBuffers[0].filename,
        contentType: 'application/pdf',
      };
    }

    // If multiple PDFs, create a ZIP archive
    return this.createZipArchive(pdfBuffers);
  }

  /**
   * Create a ZIP archive from multiple PDF buffers
   */
  private async createZipArchive(
    pdfBuffers: Array<{ buffer: Buffer; filename: string }>
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];

      archive.on('data', (chunk) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        const zipBuffer = Buffer.concat(chunks);
        resolve({
          buffer: zipBuffer,
          filename: `registrations_export_${Date.now()}.zip`,
          contentType: 'application/zip',
        });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      // Add all PDFs to the archive
      pdfBuffers.forEach(({ buffer, filename }) => {
        archive.append(buffer, { name: filename });
      });

      archive.finalize();
    });
  }

}

