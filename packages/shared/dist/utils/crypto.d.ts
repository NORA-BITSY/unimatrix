export declare class CryptoUtil {
    private static deriveKey;
    static encrypt(text: string, password: string): string;
    static decrypt(encryptedData: string, password: string): string;
    static hash(text: string): string;
    static generateApiKey(): string;
    static generateJWTSecret(): string;
    static generateRandomBytes(length: number): string;
    static compareHashes(hash1: string, hash2: string): boolean;
}
//# sourceMappingURL=crypto.d.ts.map