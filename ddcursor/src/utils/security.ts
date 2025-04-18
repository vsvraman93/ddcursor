import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || '';

export const encryptData = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
};

export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
};

export const generateHash = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};

export const validatePassword = (password: string): boolean => {
  // Password must be at least 8 characters long and contain:
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one number
  // - At least one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const sanitizeFileName = (fileName: string): string => {
  // Remove any characters that could be used for path traversal
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
};

export const generateWatermark = (text: string, user: string): string => {
  const timestamp = new Date().toISOString();
  return `CONFIDENTIAL - ${text} - ${user} - ${timestamp}`;
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return fileExtension ? allowedTypes.includes(fileExtension) : false;
};

export const validateFileSize = (size: number, limit: number): boolean => {
  return size <= limit;
};

export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const maskSensitiveData = (data: string, type: 'email' | 'phone' | 'ssn'): string => {
  switch (type) {
    case 'email':
      const [username, domain] = data.split('@');
      return `${username.charAt(0)}${'*'.repeat(username.length - 2)}${username.charAt(username.length - 1)}@${domain}`;
    case 'phone':
      return `***-***-${data.slice(-4)}`;
    case 'ssn':
      return `***-**-${data.slice(-4)}`;
    default:
      return data;
  }
};

export const validateToken = (token: string): boolean => {
  // Basic token validation
  // In a production environment, you would want to validate against a stored token
  // and check for expiration
  return token.length >= 32 && /^[a-f0-9]+$/.test(token);
};

export const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const validateSession = (sessionId: string): boolean => {
  // In a production environment, you would want to validate the session against
  // a stored session and check for expiration
  return sessionId.length > 0 && sessionId.includes('-');
};

export const generateApiKey = (): string => {
  const prefix = 'ddc_';
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  const key = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}${key}`;
};

export const validateApiKey = (apiKey: string): boolean => {
  // Basic API key validation
  // In a production environment, you would want to validate against stored API keys
  return apiKey.startsWith('ddc_') && apiKey.length === 69; // 4 (prefix) + 64 (key)
}; 