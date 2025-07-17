export interface BlockchainNetwork {
    name: string;
    chainId: number;
    rpcUrl: string;
    nativeCurrency: {
        symbol: string;
        decimals: number;
    };
    blockExplorer: string;
}
export interface WalletBalance {
    address: string;
    balance: string;
    formattedBalance: string;
    currency: string;
}
export interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    gasPrice: string;
    gasLimit: string;
    gasUsed?: string;
    status?: number;
    blockNumber?: number;
    timestamp?: number;
}
export interface SmartContractCall {
    contractAddress: string;
    functionName: string;
    parameters: any[];
    abi: any[];
}
export interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
}
declare class BlockchainService {
    private providers;
    private networks;
    private wallet?;
    constructor();
    private initializeNetworks;
    private initializeProviders;
    private initializeWallet;
    getAvailableNetworks(): string[];
    getNetworkInfo(networkName: string): BlockchainNetwork | undefined;
    getBalance(address: string, networkName?: string): Promise<WalletBalance | null>;
    getTransaction(txHash: string, networkName?: string): Promise<Transaction | null>;
    sendTransaction(to: string, value: string, networkName?: string): Promise<string | null>;
    callContract(call: SmartContractCall, networkName?: string): Promise<any>;
    getTokenInfo(tokenAddress: string, networkName?: string): Promise<TokenInfo | null>;
    getTokenBalance(tokenAddress: string, walletAddress: string, networkName?: string): Promise<string | null>;
    getGasPrice(networkName?: string): Promise<string | null>;
    getBlockNumber(networkName?: string): Promise<number | null>;
    checkNetworkHealth(networkName: string): Promise<boolean>;
    getNetworkStats(): Promise<any>;
}
export declare const blockchainService: BlockchainService;
export {};
//# sourceMappingURL=blockchain.d.ts.map