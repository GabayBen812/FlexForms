import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfGeneratorService {
  private browser: puppeteer.Browser | null = null;

  async onModuleInit() {
    // Initialize browser on module init for better performance
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      console.log('Puppeteer browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Puppeteer browser:', error);
    }
  }

  async onModuleDestroy() {
    // Clean up browser on module destroy
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generates a PDF from HTML string
   * @param html The HTML content to convert to PDF
   * @param options Optional PDF generation options
   * @returns Buffer containing the PDF
   */
  async generatePdfFromHtml(
    html: string,
    options?: {
      format?: 'A4' | 'Letter';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
    }
  ): Promise<Buffer> {
    let browser = this.browser;
    let shouldCloseBrowser = false;

    try {
      // If browser is not initialized or closed, create a new one
      if (!browser || !browser.isConnected()) {
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
        });
        shouldCloseBrowser = true;
      }

      const page = await browser.newPage();

      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options?.format || 'A4',
        margin: options?.margin || {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        printBackground: true,
      });

      await page.close();

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    } finally {
      // Close browser if we created a temporary one
      if (shouldCloseBrowser && browser) {
        await browser.close();
      }
    }
  }

  /**
   * Converts image URL to base64 data URL
   * This is useful for embedding images in PDFs
   * @param imageUrl The URL of the image to convert
   * @returns Base64 data URL or the original URL if conversion fails
   */
  async convertImageToBase64(imageUrl: string): Promise<string> {
    try {
      // If it's already a base64 data URL, return as is
      if (imageUrl.startsWith('data:')) {
        return imageUrl;
      }

      // For now, return the original URL
      // In production, you might want to fetch and convert the image
      return imageUrl;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return imageUrl;
    }
  }
}

