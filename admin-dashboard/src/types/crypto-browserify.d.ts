declare module 'crypto-browserify' {
  export function createHash(algorithm: string): {
    update(data: string | Buffer): {
      digest(encoding: string): string;
    };
  };
  
  export function createHmac(algorithm: string, key: string | Buffer): {
    update(data: string | Buffer): {
      digest(encoding: string): string;
    };
  };
  
  export function randomBytes(size: number): Buffer;
  
  // Add other crypto functions as needed
}