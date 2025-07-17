import { createCipheriv, createDecipheriv, createHash, randomBytes, pbkdf2Sync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

export class CryptoUtil {
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  static encrypt(text: string, password: string): string {
    try {
      const salt = randomBytes(SALT_LENGTH);
      const iv = randomBytes(IV_LENGTH);
      const key = this.deriveKey(password, salt);
      
      const cipher = createCipheriv(ALGORITHM, key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return salt.toString('hex') + iv.toString('hex') + 
             tag.toString('hex') + encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static decrypt(encryptedData: string, password: string): string {
    try {
      const saltHex = encryptedData.slice(0, SALT_LENGTH * 2);
      const ivHex = encryptedData.slice(SALT_LENGTH * 2, SALT_LENGTH * 2 + IV_LENGTH * 2);
      const tagHex = encryptedData.slice(SALT_LENGTH * 2 + IV_LENGTH * 2, SALT_LENGTH * 2 + IV_LENGTH * 2 + TAG_LENGTH * 2);
      const encrypted = encryptedData.slice(SALT_LENGTH * 2 + IV_LENGTH * 2 + TAG_LENGTH * 2);
      
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const key = this.deriveKey(password, salt);
      
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static hash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  static generateApiKey(): string {
    return randomBytes(32).toString('hex');
  }

  static generateJWTSecret(): string {
    return randomBytes(64).toString('hex');
  }

  static generateRandomBytes(length: number): string {
    return randomBytes(length).toString('hex');
  }

  static compareHashes(hash1: string, hash2: string): boolean {
    if (hash1.length !== hash2.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < hash1.length; i++) {
      result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
    }
    
    return result === 0;
  }
}
