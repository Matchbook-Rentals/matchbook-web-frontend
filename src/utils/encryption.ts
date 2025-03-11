'use server';

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Encryption key - should be in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY) {
  console.error('ENCRYPTION_KEY is not defined in environment variables');
}

/**
 * Encrypts sensitive data like SSN
 * @param text Plain text to encrypt
 * @returns Object containing encrypted data, iv, and authTag for decryption
 */
export async function encryptData(text: string): Promise<string | null> {
  try {
    if (!text || !ENCRYPTION_KEY) return null;

    // Generate a random initialization vector
    const iv = randomBytes(16);
    
    // Create cipher with key, iv, and algorithm
    const cipher = createCipheriv(
      ENCRYPTION_ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), 
      iv
    );
    
    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Combine iv, encrypted data, and authTag into a single string
    // Format: iv:authTag:encryptedData
    const result = `${iv.toString('hex')}:${authTag}:${encrypted}`;
    
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

/**
 * Decrypts previously encrypted data
 * @param encryptedData String in format "iv:authTag:encryptedText"
 * @returns Decrypted string or null if decryption fails
 */
export async function decryptData(encryptedData: string): Promise<string | null> {
  try {
    if (!encryptedData || !ENCRYPTION_KEY) return null;
    
    // Split the encrypted data into its components
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
    
    if (!ivHex || !authTagHex || !encryptedText) {
      throw new Error('Invalid encrypted data format');
    }
    
    // Convert hex strings back to Buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Create decipher
    const decipher = createDecipheriv(
      ENCRYPTION_ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), 
      iv
    );
    
    // Set auth tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}