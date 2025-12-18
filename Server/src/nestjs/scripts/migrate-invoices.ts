/**
 * Migration script to separate invoices from payments
 * 
 * This script:
 * 1. Finds all Payment documents with nested invoice objects
 * 2. Extracts invoice data and creates Invoice documents
 * 3. Updates Payment documents with invoiceId references
 * 4. Removes nested invoice objects from Payment documents
 * 
 * Usage:
 * - Dry-run mode: node migrate-invoices.js --dry-run
 * - Actual migration: node migrate-invoices.js
 */

import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { Invoice, InvoiceSchema, InvoiceStatus } from '../schemas/invoice.schema';
import { Types } from 'mongoose';

dotenv.config();

interface MigrationStats {
  totalPayments: number;
  paymentsWithInvoices: number;
  invoicesCreated: number;
  paymentsUpdated: number;
  errors: number;
  skipped: number;
}

async function migrateInvoices(dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalPayments: 0,
    paymentsWithInvoices: 0,
    invoicesCreated: 0,
    paymentsUpdated: 0,
    errors: 0,
    skipped: 0,
  };

  try {
    // Connect to MongoDB
    const mongoUri = (process.env.MONGODB_URI || '').trim();
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get models
    const PaymentModel = mongoose.model('Payment', PaymentSchema);
    const InvoiceModel = mongoose.model('Invoice', InvoiceSchema);

    // Find all payments
    console.log('Finding all payments...');
    const allPayments = await PaymentModel.find({}).exec();
    stats.totalPayments = allPayments.length;
    console.log(`Found ${stats.totalPayments} total payments`);

    // Filter payments with nested invoice objects
    const paymentsWithInvoices = allPayments.filter(
      (payment: any) => payment.invoice && payment.invoice.id && payment.invoice.originalDocumentUrl
    );
    stats.paymentsWithInvoices = paymentsWithInvoices.length;
    console.log(`Found ${stats.paymentsWithInvoices} payments with nested invoices`);

    if (dryRun) {
      console.log('\n=== DRY RUN MODE - No changes will be made ===\n');
    }

    // Process each payment
    for (const payment of paymentsWithInvoices) {
      try {
        const paymentData: any = payment.toObject();

        // Extract invoice data
        const nestedInvoice = paymentData.invoice;
        if (!nestedInvoice || !nestedInvoice.id) {
          console.log(`Skipping payment ${payment._id}: Invalid invoice data`);
          stats.skipped++;
          continue;
        }

        // Check if invoice already exists (by GreenInvoice ID)
        let existingInvoice = await InvoiceModel.findOne({
          'greenInvoice.id': nestedInvoice.id,
        }).exec();

        if (existingInvoice) {
          console.log(
            `Invoice already exists for payment ${payment._id}, using existing invoice ${existingInvoice._id}`
          );
        } else {
          // Extract payment data to reconstruct invoice
          const cardDetails = paymentData.cardDetails || {};
          const clientData = {
            name: cardDetails.cardOwnerName || 'Unknown',
            personalId: cardDetails.cardOwnerID || '',
            email: cardDetails.cardOwnerEmail || '',
            phone: '',
            address: '',
          };

          // Calculate invoice totals from payment amount
          const invoiceAmount = paymentData.amount || 0;
          const invoiceData: any = {
            organizationId: paymentData.organizationId,
            formId: paymentData.formId,
            client: clientData,
            items: [
              {
                name: paymentData.service || 'Payment',
                quantity: 1,
                price: invoiceAmount,
                description: `Payment for ${paymentData.service || 'service'}`,
              },
            ],
            subtotal: invoiceAmount,
            tax: 0,
            total: invoiceAmount,
            paidAmount: invoiceAmount,
            remainingAmount: 0,
            greenInvoice: {
              id: nestedInvoice.id,
              originalDocumentUrl: nestedInvoice.originalDocumentUrl,
              documentType: 320, // RECEIPT
            },
            subject: `Payment receipt for ${paymentData.service || 'service'}`,
            status: InvoiceStatus.PAID,
            invoiceDate: paymentData.createdAt || new Date(),
            currency: 'ILS',
            language: 'he',
          };

          if (dryRun) {
            console.log(`Would create invoice for payment ${payment._id}:`, {
              clientName: clientData.name,
              amount: invoiceAmount,
              greenInvoiceId: nestedInvoice.id,
            });
            stats.invoicesCreated++;
          } else {
            // Generate invoice number (simplified for migration)
            const date = new Date();
            const datePrefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-`;
            const existingCount = await InvoiceModel.countDocuments({
              invoiceNumber: { $regex: `^${datePrefix}` },
            });
            const invoiceNumber = `${datePrefix}${String(existingCount + 1).padStart(6, '0')}`;

            invoiceData.invoiceNumber = invoiceNumber;

            existingInvoice = await InvoiceModel.create(invoiceData);
            console.log(`Created invoice ${existingInvoice._id} for payment ${payment._id}`);
            stats.invoicesCreated++;
          }
        }

        // Update payment with invoiceId reference
        if (!dryRun && existingInvoice) {
          await PaymentModel.updateOne(
            { _id: payment._id },
            {
              $set: {
                invoiceId: existingInvoice._id,
                paymentDate: paymentData.createdAt || new Date(),
              },
              $unset: {
                invoice: 1,
              },
            }
          ).exec();
          console.log(`Updated payment ${payment._id} with invoiceId ${existingInvoice._id}`);
          stats.paymentsUpdated++;
        } else if (dryRun) {
          console.log(`Would update payment ${payment._id} with invoiceId ${existingInvoice?._id}`);
          stats.paymentsUpdated++;
        }
      } catch (error: any) {
        console.error(`Error processing payment ${payment._id}:`, error.message);
        stats.errors++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total payments: ${stats.totalPayments}`);
    console.log(`Payments with invoices: ${stats.paymentsWithInvoices}`);
    console.log(`Invoices created: ${stats.invoicesCreated}`);
    console.log(`Payments updated: ${stats.paymentsUpdated}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Skipped: ${stats.skipped}`);

    if (dryRun) {
      console.log('\n=== DRY RUN COMPLETE - No changes were made ===');
    }

    return stats;
  } catch (error: any) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  migrateInvoices(dryRun)
    .then((stats) => {
      console.log('\nMigration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration failed:', error);
      process.exit(1);
    });
}

export { migrateInvoices };

