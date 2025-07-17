import { ethers } from 'ethers';
import { logger } from '@matrix/shared';
class BlockchainService {
    providers = new Map();
    networks = new Map();
    wallet;
    constructor() {
        this.initializeNetworks();
        this.initializeProviders();
        this.initializeWallet();
    }
    initializeNetworks() {
        // Ethereum Mainnet
        this.networks.set('ethereum', {
            name: 'Ethereum Mainnet',
            chainId: 1,
            rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-infura-key',
            nativeCurrency: { symbol: 'ETH', decimals: 18 },
            blockExplorer: 'https://etherscan.io',
        });
        // Ethereum Sepolia Testnet
        this.networks.set('sepolia', {
            name: 'Ethereum Sepolia',
            chainId: 11155111,
            rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/your-infura-key',
            nativeCurrency: { symbol: 'SepoliaETH', decimals: 18 },
            blockExplorer: 'https://sepolia.etherscan.io',
        });
        // Polygon Mainnet
        this.networks.set('polygon', {
            name: 'Polygon Mainnet',
            chainId: 137,
            rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
            nativeCurrency: { symbol: 'MATIC', decimals: 18 },
            blockExplorer: 'https://polygonscan.com',
        });
        // Binance Smart Chain
        this.networks.set('bsc', {
            name: 'BNB Smart Chain',
            chainId: 56,
            rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
            nativeCurrency: { symbol: 'BNB', decimals: 18 },
            blockExplorer: 'https://bscscan.com',
        });
        logger.info('Blockchain networks initialized', {
            networks: Array.from(this.networks.keys()),
        });
    }
    initializeProviders() {
        for (const [networkName, network] of this.networks) {
            try {
                if (network.rpcUrl && !network.rpcUrl.includes('your-infura-key')) {
                    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
                    this.providers.set(networkName, provider);
                    logger.info(`Provider initialized for ${network.name}`);
                }
                else {
                    logger.warn(`No valid RPC URL configured for ${network.name}`);
                }
            }
            catch (error) {
                logger.error(`Failed to initialize provider for ${network.name}`, { error });
            }
        }
    }
    initializeWallet() {
        const privateKey = process.env.PRIVATE_KEY;
        if (privateKey && privateKey !== 'your-private-key') {
            try {
                this.wallet = new ethers.Wallet(privateKey);
                logger.info('Wallet initialized', {
                    address: this.wallet.address
                });
            }
            catch (error) {
                logger.error('Failed to initialize wallet', { error });
            }
        }
        else {
            logger.warn('No private key configured - wallet functionality will be limited');
        }
    }
    getAvailableNetworks() {
        return Array.from(this.providers.keys());
    }
    getNetworkInfo(networkName) {
        return this.networks.get(networkName);
    }
    async getBalance(address, networkName = 'ethereum') {
        try {
            const provider = this.providers.get(networkName);
            const network = this.networks.get(networkName);
            if (!provider || !network) {
                throw new Error(`Network ${networkName} not available`);
            }
            const balance = await provider.getBalance(address);
            const formattedBalance = ethers.formatEther(balance);
            return {
                address,
                balance: balance.toString(),
                formattedBalance,
                currency: network.nativeCurrency.symbol,
            };
        }
        catch (error) {
            logger.error('Error getting balance', { address, networkName, error });
            return null;
        }
    }
    async getTransaction(txHash, networkName = 'ethereum') {
        try {
            const provider = this.providers.get(networkName);
            if (!provider) {
                throw new Error(`Network ${networkName} not available`);
            }
            const tx = await provider.getTransaction(txHash);
            const receipt = await provider.getTransactionReceipt(txHash);
            if (!tx)
                return null;
            return {
                hash: tx.hash,
                from: tx.from,
                to: tx.to || '',
                value: tx.value.toString(),
                gasPrice: tx.gasPrice?.toString() || '0',
                gasLimit: tx.gasLimit.toString(),
                gasUsed: receipt?.gasUsed.toString(),
                status: receipt?.status ?? undefined,
                blockNumber: tx.blockNumber || undefined,
                timestamp: receipt ? (await provider.getBlock(receipt.blockNumber))?.timestamp : undefined,
            };
        }
        catch (error) {
            logger.error('Error getting transaction', { txHash, networkName, error });
            return null;
        }
    }
    async sendTransaction(to, value, networkName = 'ethereum') {
        try {
            if (!this.wallet) {
                throw new Error('Wallet not initialized');
            }
            const provider = this.providers.get(networkName);
            if (!provider) {
                throw new Error(`Network ${networkName} not available`);
            }
            const connectedWallet = this.wallet.connect(provider);
            const tx = await connectedWallet.sendTransaction({
                to,
                value: ethers.parseEther(value),
            });
            logger.info('Transaction sent', {
                hash: tx.hash,
                to,
                value,
                networkName
            });
            return tx.hash;
        }
        catch (error) {
            logger.error('Error sending transaction', { to, value, networkName, error });
            return null;
        }
    }
    async callContract(call, networkName = 'ethereum') {
        try {
            const provider = this.providers.get(networkName);
            if (!provider) {
                throw new Error(`Network ${networkName} not available`);
            }
            const contract = new ethers.Contract(call.contractAddress, call.abi, provider);
            const result = await contract[call.functionName](...call.parameters);
            logger.info('Contract call executed', {
                contractAddress: call.contractAddress,
                functionName: call.functionName,
                networkName,
            });
            return result;
        }
        catch (error) {
            logger.error('Error calling contract', { call, networkName, error });
            throw error;
        }
    }
    async getTokenInfo(tokenAddress, networkName = 'ethereum') {
        try {
            const erc20Abi = [
                'function name() view returns (string)',
                'function symbol() view returns (string)',
                'function decimals() view returns (uint8)',
                'function totalSupply() view returns (uint256)',
            ];
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                this.callContract({
                    contractAddress: tokenAddress,
                    functionName: 'name',
                    parameters: [],
                    abi: erc20Abi,
                }, networkName),
                this.callContract({
                    contractAddress: tokenAddress,
                    functionName: 'symbol',
                    parameters: [],
                    abi: erc20Abi,
                }, networkName),
                this.callContract({
                    contractAddress: tokenAddress,
                    functionName: 'decimals',
                    parameters: [],
                    abi: erc20Abi,
                }, networkName),
                this.callContract({
                    contractAddress: tokenAddress,
                    functionName: 'totalSupply',
                    parameters: [],
                    abi: erc20Abi,
                }, networkName),
            ]);
            return {
                address: tokenAddress,
                name,
                symbol,
                decimals: Number(decimals),
                totalSupply: totalSupply.toString(),
            };
        }
        catch (error) {
            logger.error('Error getting token info', { tokenAddress, networkName, error });
            return null;
        }
    }
    async getTokenBalance(tokenAddress, walletAddress, networkName = 'ethereum') {
        try {
            const erc20Abi = [
                'function balanceOf(address owner) view returns (uint256)',
                'function decimals() view returns (uint8)',
            ];
            const [balance, decimals] = await Promise.all([
                this.callContract({
                    contractAddress: tokenAddress,
                    functionName: 'balanceOf',
                    parameters: [walletAddress],
                    abi: erc20Abi,
                }, networkName),
                this.callContract({
                    contractAddress: tokenAddress,
                    functionName: 'decimals',
                    parameters: [],
                    abi: erc20Abi,
                }, networkName),
            ]);
            return ethers.formatUnits(balance, decimals);
        }
        catch (error) {
            logger.error('Error getting token balance', { tokenAddress, walletAddress, networkName, error });
            return null;
        }
    }
    async getGasPrice(networkName = 'ethereum') {
        try {
            const provider = this.providers.get(networkName);
            if (!provider) {
                throw new Error(`Network ${networkName} not available`);
            }
            const gasPrice = await provider.getFeeData();
            return gasPrice.gasPrice?.toString() || null;
        }
        catch (error) {
            logger.error('Error getting gas price', { networkName, error });
            return null;
        }
    }
    async getBlockNumber(networkName = 'ethereum') {
        try {
            const provider = this.providers.get(networkName);
            if (!provider) {
                throw new Error(`Network ${networkName} not available`);
            }
            return await provider.getBlockNumber();
        }
        catch (error) {
            logger.error('Error getting block number', { networkName, error });
            return null;
        }
    }
    // Health check for blockchain connections
    async checkNetworkHealth(networkName) {
        try {
            const blockNumber = await this.getBlockNumber(networkName);
            return blockNumber !== null && blockNumber > 0;
        }
        catch (error) {
            return false;
        }
    }
    async getNetworkStats() {
        const stats = {};
        for (const networkName of this.getAvailableNetworks()) {
            const isHealthy = await this.checkNetworkHealth(networkName);
            const blockNumber = isHealthy ? await this.getBlockNumber(networkName) : null;
            const gasPrice = isHealthy ? await this.getGasPrice(networkName) : null;
            stats[networkName] = {
                healthy: isHealthy,
                blockNumber,
                gasPrice: gasPrice ? ethers.formatUnits(gasPrice, 'gwei') + ' gwei' : null,
                network: this.getNetworkInfo(networkName),
            };
        }
        return stats;
    }
}
export const blockchainService = new BlockchainService();
//# sourceMappingURL=blockchain.js.map