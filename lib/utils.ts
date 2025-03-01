import md5Package from 'md5';

/**
 * Generate MD5 hash for Gravatar URL
 * This is a browser-compatible implementation
 */
export function md5(input: string): string {
  const txtEncoder = new TextEncoder();
  const data = txtEncoder.encode(input.toLowerCase().trim());
  
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get Gravatar URL from email
 */
export function getGravatarUrl(email: string): string {
  const hash = md5Package(email.toLowerCase().trim());
  return `https://www.gravatar.com/avatar/${hash}?s=200&d=mp`;
} 