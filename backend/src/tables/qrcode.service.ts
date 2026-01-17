import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QRCodeService {
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    // Base URL for QR codes (frontend URL)
    this.baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  /**
   * Generate a unique QR code identifier for a table
   */
  generateQRCodeId(restaurantSlug: string, tableNumber: number): string {
    const uniquePart = uuidv4().split('-')[0].toUpperCase();
    return `${restaurantSlug.toUpperCase()}-M${tableNumber}-${uniquePart}`;
  }

  /**
   * Generate the URL that the QR code will point to
   */
  generateTableUrl(restaurantSlug: string, qrCode: string): string {
    return `${this.baseUrl}/r/${restaurantSlug}/mesa/${qrCode}`;
  }

  /**
   * Generate QR code as base64 data URL
   */
  async generateQRCodeDataUrl(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
    } catch (error) {
      throw new Error('Erro ao gerar QR Code');
    }
  }

  /**
   * Generate QR code as SVG string
   */
  async generateQRCodeSvg(url: string): Promise<string> {
    try {
      return await QRCode.toString(url, {
        type: 'svg',
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
    } catch (error) {
      throw new Error('Erro ao gerar QR Code SVG');
    }
  }
}

