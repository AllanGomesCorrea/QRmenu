import api from './api';

interface PublicKeyResponse {
  publicKey: string;
  algorithm: string;
  hash: string;
}

let cachedPublicKey: CryptoKey | null = null;

/**
 * Fetch the RSA public key from the server
 */
async function fetchPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) {
    return cachedPublicKey;
  }

  const response = await api.get<PublicKeyResponse>('/auth/public-key');
  const { publicKey } = response.data;

  // Decode base64 to ArrayBuffer
  const binaryString = atob(publicKey);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Import the public key
  cachedPublicKey = await crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );

  return cachedPublicKey;
}

/**
 * Encrypt a password using the server's RSA public key
 */
export async function encryptPassword(password: string): Promise<string> {
  try {
    const publicKey = await fetchPublicKey();
    
    // Encode password to bytes
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      passwordBytes
    );

    // Convert to base64
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    let binary = '';
    for (let i = 0; i < encryptedBytes.length; i++) {
      binary += String.fromCharCode(encryptedBytes[i]);
    }
    
    return btoa(binary);
  } catch (error) {
    console.error('Encryption failed:', error);
    // If encryption fails, return the original password
    // This provides backward compatibility
    return password;
  }
}

/**
 * Clear the cached public key (useful if server restarts with new keys)
 */
export function clearCachedKey(): void {
  cachedPublicKey = null;
}

