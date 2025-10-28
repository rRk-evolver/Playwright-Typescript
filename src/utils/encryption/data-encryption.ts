import * as crypto from 'crypto';
import { Logger } from '../logger';

const logger = Logger.getInstance();

/**
 * Simple Data Encryption utility for testing purposes
 * Provides basic encryption/decryption functionality
 */
export class DataEncryption {
  private secretKey: string;

  constructor(encryptionKey?: string) {
    this.secretKey = encryptionKey || process.env.ENCRYPTION_KEY || 'test-key-for-data-encryption';
    logger.debug('DataEncryption initialized');
  }

  /**
   * Simple encrypt method using base64 encoding for testing
   * @param text - Plain text to encrypt
   * @returns Base64 encoded text
   */
  async encrypt(text: string): Promise<string> {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text to encrypt must be a non-empty string');
      }

      // Simple base64 encoding for testing purposes
      const encoded = Buffer.from(text + ':' + this.secretKey).toString('base64');
      logger.debug(`Encrypted text of length ${text.length}`);
      return encoded;
    } catch (error: any) {
      logger.error('Encryption failed:', error);
      throw new Error(`Encryption failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Simple decrypt method using base64 decoding for testing
   * @param encryptedText - Base64 encoded text
   * @returns Decrypted plain text
   */
  async decrypt(encryptedText: string): Promise<string> {
    try {
      if (!encryptedText || typeof encryptedText !== 'string') {
        throw new Error('Encrypted text must be a non-empty string');
      }

      // Simple base64 decoding for testing purposes
      const decoded = Buffer.from(encryptedText, 'base64').toString('utf8');
      const parts = decoded.split(':');
      
      if (parts.length < 2 || !parts[1] || parts[1] !== this.secretKey) {
        throw new Error('Invalid encrypted text or wrong key');
      }

      const result = parts.slice(0, -1).join(':'); // Remove the key part
      logger.debug(`Decrypted text to length ${result.length}`);
      return result;
    } catch (error: any) {
      logger.error('Decryption failed:', error);
      throw new Error(`Decryption failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate a hash of the input string
   * @param text - Text to hash
   * @returns SHA-256 hash
   */
  hash(text: string): string {
    try {
      const hash = crypto.createHash('sha256');
      hash.update(text, 'utf8');
      const result = hash.digest('hex');
      
      logger.debug(`Generated hash for text of length ${text.length}`);
      return result;
    } catch (error: any) {
      logger.error('Hashing failed:', error);
      throw new Error(`Hashing failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate a secure random string
   * @param length - Length of the random string
   * @returns Random hex string
   */
  generateRandomString(length: number = 32): string {
    try {
      const bytes = Math.ceil(length / 2);
      const randomBytes = crypto.randomBytes(bytes);
      const result = randomBytes.toString('hex').substring(0, length);
      
      logger.debug(`Generated random string of length ${result.length}`);
      return result;
    } catch (error: any) {
      logger.error('Random string generation failed:', error);
      throw new Error(`Random string generation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Mask sensitive data for logging purposes
   * @param text - Text to mask
   * @param visibleChars - Number of characters to show at start and end
   * @returns Masked string
   */
  maskSensitiveData(text: string, visibleChars: number = 3): string {
    if (!text || text.length <= visibleChars * 2) {
      return '*'.repeat(text?.length || 8);
    }
    
    const start = text.substring(0, visibleChars);
    const end = text.substring(text.length - visibleChars);
    const maskLength = Math.max(3, text.length - (visibleChars * 2));
    
    return `${start}${'*'.repeat(maskLength)}${end}`;
  }

  /**
   * Check if text appears to be encrypted by this utility
   * @param text - Text to validate
   * @returns True if text looks encrypted
   */
  isEncrypted(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    try {
      // Try to decode as base64
      const decoded = Buffer.from(text, 'base64').toString('utf8');
      return decoded.includes(':') && decoded.split(':').length >= 2;
    } catch {
      return false;
    }
  }
}