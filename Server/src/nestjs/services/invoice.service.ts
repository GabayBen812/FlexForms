import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument, InvoiceStatus } from '../schemas/invoice.schema';
import { fetchDocumentFileName } from '../utils/document.utils';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  /**
   * Calculate invoice totals from items
   */
  calculateTotals(items: Array<{ price: number; quantity: number; vatType?: number }>, vatType?: number): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    let subtotal = 0;

    // Calculate subtotal from all items
    items.forEach((item) => {
      subtotal += item.price * item.quantity;
    });

    let tax = 0;
    let total = subtotal;

    // Calculate tax based on VAT type
    if (vatType !== undefined && vatType !== 0) {
      // VAT is included or excluded
      if (vatType === 1) {
        // VAT included - extract tax from total
        const vatRate = 0.17; // 17% VAT rate for Israel
        tax = subtotal - (subtotal / (1 + vatRate));
        total = subtotal;
      } else if (vatType === 2) {
        // VAT excluded - add tax to subtotal
        const vatRate = 0.17;
        tax = subtotal * vatRate;
        total = subtotal + tax;
      }
    }

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Generate a unique invoice number
   * Format: INV-YYYYMMDD-XXXXXX (e.g., INV-20240115-000001)
   */
  async generateInvoiceNumber(organizationId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePrefix = `INV-${year}${month}${day}-`;

    // Find the highest invoice number for today
    const todayInvoices = await this.invoiceModel
      .find({
        organizationId: new Types.ObjectId(organizationId),
        invoiceNumber: { $regex: `^${datePrefix}` },
      })
      .sort({ invoiceNumber: -1 })
      .limit(1)
      .exec();

    let sequenceNumber = 1;
    if (todayInvoices.length > 0) {
      const lastInvoiceNumber = todayInvoices[0].invoiceNumber;
      const lastSequence = parseInt(lastInvoiceNumber.split('-')[2] || '0', 10);
      sequenceNumber = lastSequence + 1;
    }

    const invoiceNumber = `${datePrefix}${String(sequenceNumber).padStart(6, '0')}`;

    // Double-check uniqueness
    const exists = await this.invoiceModel.findOne({ invoiceNumber }).exec();
    if (exists) {
      // If somehow it exists, try with a timestamp suffix
      return `${invoiceNumber}-${Date.now()}`;
    }

    return invoiceNumber;
  }

  /**
   * Create a new invoice
   */
  async create(data: Partial<Invoice>): Promise<InvoiceDocument> {
    // Generate invoice number if not provided
    if (!data.invoiceNumber && data.organizationId) {
      data.invoiceNumber = await this.generateInvoiceNumber(
        data.organizationId.toString(),
      );
    }

    // Calculate totals if not provided
    if (data.items && data.items.length > 0) {
      if (data.subtotal === undefined || data.total === undefined) {
        const totals = this.calculateTotals(data.items, data.vatType);
        data.subtotal = totals.subtotal;
        data.tax = totals.tax;
        data.total = totals.total;
      }
    }

    // Set initial paidAmount and remainingAmount
    if (data.total !== undefined) {
      data.paidAmount = data.paidAmount || 0;
      data.remainingAmount = (data.total - (data.paidAmount || 0));
    }

    // Set default status if not provided
    if (!data.status) {
      data.status = InvoiceStatus.DRAFT;
    }

    // Set default dates
    if (!data.invoiceDate) {
      data.invoiceDate = new Date();
    }

    return this.invoiceModel.create(data);
  }

  /**
   * Find invoice by ID
   */
  async findById(id: string): Promise<InvoiceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid invoice ID');
    }

    const invoice = await this.invoiceModel
      .findById(id)
      .populate('organizationId')
      .populate('formId')
      .exec();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    await this.ensureExternalInvoiceNumber(invoice);

    return invoice;
  }

  /**
   * Find invoices by organization
   */
  async findByOrganization(
    organizationId: string,
    filters?: { status?: InvoiceStatus; fromDate?: Date; toDate?: Date },
  ): Promise<InvoiceDocument[]> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestException('Invalid organization ID');
    }

    const query: any = {
      organizationId: new Types.ObjectId(organizationId),
    };

    if (filters) {
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.fromDate || filters.toDate) {
        query.invoiceDate = {};
        if (filters.fromDate) {
          query.invoiceDate.$gte = filters.fromDate;
        }
        if (filters.toDate) {
          query.invoiceDate.$lte = filters.toDate;
        }
      }
    }

    return this.invoiceModel
      .find(query)
      .sort({ invoiceDate: -1 })
      .populate('formId')
      .exec();
  }

  /**
   * Find invoices by form
   */
  async findByForm(formId: string): Promise<InvoiceDocument[]> {
    if (!Types.ObjectId.isValid(formId)) {
      throw new BadRequestException('Invalid form ID');
    }

    return this.invoiceModel
      .find({ formId: new Types.ObjectId(formId) })
      .sort({ invoiceDate: -1 })
      .populate('organizationId')
      .exec();
  }

  /**
   * Update invoice
   */
  async update(id: string, data: Partial<Invoice>): Promise<InvoiceDocument> {
    const invoice = await this.findById(id);

    // Recalculate totals if items are being updated
    if (data.items && data.items.length > 0) {
      const totals = this.calculateTotals(data.items, data.vatType ?? invoice.vatType);
      data.subtotal = totals.subtotal;
      data.tax = totals.tax;
      data.total = totals.total;
      // Recalculate remaining amount based on existing paidAmount
      data.remainingAmount = totals.total - (data.paidAmount ?? invoice.paidAmount);
    }

    // If total is updated but paidAmount exists, recalculate remainingAmount
    if (data.total !== undefined && invoice.paidAmount !== undefined) {
      data.remainingAmount = data.total - invoice.paidAmount;
    }

    Object.assign(invoice, data);
    return invoice.save();
  }

  /**
   * Update invoice status
   */
  async updateStatus(id: string, status: InvoiceStatus): Promise<InvoiceDocument> {
    const invoice = await this.findById(id);
    invoice.status = status;
    return invoice.save();
  }

  /**
   * Add payment to invoice and update amounts
   */
  async addPayment(invoiceId: string, paymentAmount: number): Promise<InvoiceDocument> {
    const invoice = await this.findById(invoiceId);

    const newPaidAmount = (invoice.paidAmount || 0) + paymentAmount;
    invoice.paidAmount = newPaidAmount;
    invoice.remainingAmount = invoice.total - newPaidAmount;

    // Update status based on payment
    if (invoice.remainingAmount <= 0) {
      invoice.status = InvoiceStatus.PAID;
    } else if (invoice.status === InvoiceStatus.DRAFT) {
      invoice.status = InvoiceStatus.SENT;
    }

    return invoice.save();
  }

  /**
   * Remove payment from invoice and recalculate amounts
   */
  async removePayment(invoiceId: string, paymentAmount: number): Promise<InvoiceDocument> {
    const invoice = await this.findById(invoiceId);

    const newPaidAmount = Math.max(0, (invoice.paidAmount || 0) - paymentAmount);
    invoice.paidAmount = newPaidAmount;
    invoice.remainingAmount = invoice.total - newPaidAmount;

    // Update status based on payment
    if (invoice.remainingAmount > 0 && invoice.status === InvoiceStatus.PAID) {
      invoice.status = InvoiceStatus.SENT;
    }

    return invoice.save();
  }

  /**
   * Find all invoices with optional filters
   */
  async findAll(filters?: {
    organizationId?: string;
    status?: InvoiceStatus;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<InvoiceDocument[]> {
    const query: any = {};

    if (filters) {
      if (filters.organizationId && Types.ObjectId.isValid(filters.organizationId)) {
        query.organizationId = new Types.ObjectId(filters.organizationId);
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.fromDate || filters.toDate) {
        query.invoiceDate = {};
        if (filters.fromDate) {
          query.invoiceDate.$gte = filters.fromDate;
        }
        if (filters.toDate) {
          query.invoiceDate.$lte = filters.toDate;
        }
      }
    }

    return this.invoiceModel
      .find(query)
      .sort({ invoiceDate: -1 })
      .populate('organizationId')
      .populate('formId')
      .exec();
  }

  private async ensureExternalInvoiceNumber(invoice: InvoiceDocument): Promise<void> {
    if (invoice.externalInvoiceNumber) {
      return;
    }
    const url =
      invoice.greenInvoice?.originalDocumentUrl ||
      invoice.icount?.originalDocumentUrl;
    if (!url) {
      return;
    }
    const fileName = await fetchDocumentFileName(url).catch(() => null);
    if (fileName) {
      invoice.externalInvoiceNumber = fileName;
      await invoice.save();
    }
  }
}

