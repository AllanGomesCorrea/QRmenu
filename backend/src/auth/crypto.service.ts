import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService implements OnModuleInit {
  private publicKey: string;
  private privateKey: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Check if keys are provided via environment variables
    const envPublicKey = this.configService.get<string>('RSA_PUBLIC_KEY');
    const envPrivateKey = this.configService.get<string>('RSA_PRIVATE_KEY');

    if (envPublicKey && envPrivateKey) {
      // Use keys from environment (production)
      this.publicKey = envPublicKey.replace(/\\n/g, '\n');
      this.privateKey = envPrivateKey.replace(/\\n/g, '\n');
      console.log('🔐 Using RSA keys from environment variables');
    } else {
      // Generate new keys (development)
      this.generateKeyPair();
      console.log('🔐 Generated new RSA key pair for development');
    }
  }

  private generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  /**
   * Get the public key in PEM format for the frontend
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Get the public key in a format suitable for Web Crypto API (base64 DER)
   */
  getPublicKeyForWebCrypto(): string {
    // Remove PEM headers and convert to base64
    const pemContent = this.publicKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\n/g, '')
      .trim();
    
    return pemContent;
  }

  /**
   * Decrypt a message encrypted with the public key
   */
  decrypt(encryptedBase64: string): string {
    try {
      const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
      
      const decrypted = crypto.privateDecrypt(
        {
          key: this.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedBuffer,
      );

      return decrypted.toString('utf8');
    } catch (error) {
      // If decryption fails, return the original string
      // This allows backward compatibility with non-encrypted passwords
      console.warn('⚠️ Password decryption failed, using as plain text');
      return encryptedBase64;
    }
  }

  /**
   * Check if a string looks like it's encrypted (base64 with specific length)
   */
  isEncrypted(value: string): boolean {
    // RSA 2048-bit encrypted data is always 256 bytes = 344 base64 chars
    const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
    return value.length >= 100 && base64Pattern.test(value);
  }
}

