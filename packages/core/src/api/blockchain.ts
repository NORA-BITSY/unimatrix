import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { blockchainService } from '../services/blockchain.js';
import { ValidationError } from '@matrix/shared';
import { authMiddleware } from '../middleware/auth.js';

// Validation schemas
const networkSchema = z.enum(['ethereum', 'sepolia', 'polygon', 'bsc']);

const balanceRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  network: networkSchema.optional().default('ethereum'),
});

const transactionRequestSchema = z.object({
  hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
  network: networkSchema.optional().default('ethereum'),
});

const sendTransactionSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
  value: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid ETH amount'),
  network: networkSchema.optional().default('ethereum'),
});

const contractCallSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  functionName: z.string().min(1),
  parameters: z.array(z.any()).default([]),
  abi: z.array(z.any()),
  network: networkSchema.optional().default('ethereum'),
});

const tokenInfoSchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address'),
  network: networkSchema.optional().default('ethereum'),
});

const tokenBalanceSchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address'),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  network: networkSchema.optional().default('ethereum'),
});

export async function blockchainRoutes(fastify: FastifyInstance) {
  // Helper for authentication
  const authenticate = async (request: any, reply: any) => {
    await authMiddleware(request, reply);
  };

  // Get available networks
  fastify.get('/networks', {
    preHandler: [async (request: any, reply: any) => {
      await authMiddleware(request, reply);
    }],
    schema: {
      tags: ['Blockchain'],
      summary: 'Get available blockchain networks',
      security: [{ bearerAuth: [] }],
    },
  }, async (_request, reply) => {
    try {
      const networks = blockchainService.getAvailableNetworks();
      const networkDetails = networks.map(name => ({
        name,
        info: blockchainService.getNetworkInfo(name),
      }));

      await reply.send({
        success: true,
        data: { networks: networkDetails },
      });
    } catch (error) {
      throw error;
    }
  });

  // Get network statistics
  fastify.get('/stats', {
    preHandler: [authenticate],
    schema: {
      tags: ['Blockchain'],
      summary: 'Get blockchain network statistics',
      security: [{ bearerAuth: [] }],
    },
  }, async (_request, reply) => {
    try {
      const stats = await blockchainService.getNetworkStats();

      await reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get wallet balance
  fastify.post('/balance', {
    preHandler: [authenticate],
    schema: {
      tags: ['Blockchain'],
      summary: 'Get wallet balance',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          network: { type: 'string', enum: ['ethereum', 'sepolia', 'polygon', 'bsc'] },
        },
        required: ['address'],
      },
    },
  }, async (request, reply) => {
    try {
      const { address, network } = balanceRequestSchema.parse(request.body);
      
      const balance = await blockchainService.getBalance(address, network);
      
      if (!balance) {
        throw new ValidationError('Failed to retrieve balance');
      }

      await reply.send({
        success: true,
        data: balance,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get transaction details
  fastify.post('/transaction', {
    preHandler: [authenticate],
    schema: {
      tags: ['Blockchain'],
      summary: 'Get transaction details',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          hash: { type: 'string', pattern: '^0x[a-fA-F0-9]{64}$' },
          network: { type: 'string', enum: ['ethereum', 'sepolia', 'polygon', 'bsc'] },
        },
        required: ['hash'],
      },
    },
  }, async (request, reply) => {
    try {
      const { hash, network } = transactionRequestSchema.parse(request.body);
      
      const transaction = await blockchainService.getTransaction(hash, network);
      
      if (!transaction) {
        throw new ValidationError('Transaction not found');
      }

      await reply.send({
        success: true,
        data: transaction,
      });
    } catch (error) {
      throw error;
    }
  });

  // Send transaction (requires private key configuration)
  fastify.post('/send', {
    preHandler: [authenticate],
    schema: {
      tags: ['Blockchain'],
      summary: 'Send transaction',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          to: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          value: { type: 'string', pattern: '^\\d+(\\.\\d+)?$' },
          network: { type: 'string', enum: ['ethereum', 'sepolia', 'polygon', 'bsc'] },
        },
        required: ['to', 'value'],
      },
    },
  }, async (request, reply) => {
    try {
      const { to, value, network } = sendTransactionSchema.parse(request.body);
      
      const txHash = await blockchainService.sendTransaction(to, value, network);
      
      if (!txHash) {
        throw new ValidationError('Failed to send transaction');
      }

      await reply.send({
        success: true,
        data: { transactionHash: txHash },
      });
    } catch (error) {
      throw error;
    }
  });

  // Call smart contract function
  fastify.post('/contract/call', {
    preHandler: [authenticate],
    schema: {
      tags: ['Blockchain'],
      summary: 'Call smart contract function',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          contractAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          functionName: { type: 'string', minLength: 1 },
          parameters: { type: 'array', default: [] },
          abi: { type: 'array' },
          network: { type: 'string', enum: ['ethereum', 'sepolia', 'polygon', 'bsc'] },
        },
        required: ['contractAddress', 'functionName', 'abi'],
      },
    },
  }, async (request, reply) => {
    try {
      const { contractAddress, functionName, parameters, abi, network } = 
        contractCallSchema.parse(request.body);
      
      const result = await blockchainService.callContract({
        contractAddress,
        functionName,
        parameters,
        abi,
      }, network);

      await reply.send({
        success: true,
        data: { result },
      });
    } catch (error) {
      throw error;
    }
  });

  // Get token information
  fastify.post('/token/info', {
    preHandler: [authenticate],
    schema: {
      tags: ['Blockchain'],
      summary: 'Get ERC-20 token information',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          tokenAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          network: { type: 'string', enum: ['ethereum', 'sepolia', 'polygon', 'bsc'] },
        },
        required: ['tokenAddress'],
      },
    },
  }, async (request, reply) => {
    try {
      const { tokenAddress, network } = tokenInfoSchema.parse(request.body);
      
      const tokenInfo = await blockchainService.getTokenInfo(tokenAddress, network);
      
      if (!tokenInfo) {
        throw new ValidationError('Failed to retrieve token information');
      }

      await reply.send({
        success: true,
        data: tokenInfo,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get token balance
  fastify.post('/token/balance', {
    preHandler: [authenticate],
    schema: {
      tags: ['Blockchain'],
      summary: 'Get ERC-20 token balance',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          tokenAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          network: { type: 'string', enum: ['ethereum', 'sepolia', 'polygon', 'bsc'] },
        },
        required: ['tokenAddress', 'walletAddress'],
      },
    },
  }, async (request, reply) => {
    try {
      const { tokenAddress, walletAddress, network } = tokenBalanceSchema.parse(request.body);
      
      const balance = await blockchainService.getTokenBalance(tokenAddress, walletAddress, network);
      
      if (balance === null) {
        throw new ValidationError('Failed to retrieve token balance');
      }

      await reply.send({
        success: true,
        data: { 
          tokenAddress,
          walletAddress,
          balance,
          network,
        },
      });
    } catch (error) {
      throw error;
    }
  });

  // Get gas price
  fastify.get('/gas/:network?', {
    preHandler: [authenticate],
    schema: {
      tags: ['Blockchain'],
      summary: 'Get current gas price',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          network: { type: 'string', enum: ['ethereum', 'sepolia', 'polygon', 'bsc'] },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const network = request.params.network || 'ethereum';
      
      const gasPrice = await blockchainService.getGasPrice(network);
      
      if (!gasPrice) {
        throw new ValidationError('Failed to retrieve gas price');
      }

      await reply.send({
        success: true,
        data: { 
          network,
          gasPrice,
          gasPriceGwei: parseFloat((BigInt(gasPrice) / BigInt(1e9)).toString()).toFixed(2) + ' gwei',
        },
      });
    } catch (error) {
      throw error;
    }
  });

  // Get latest block number
  fastify.get('/block/:network?', {
    preHandler: [authenticate],
    schema: {
      tags: ['Blockchain'],
      summary: 'Get latest block number',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          network: { type: 'string', enum: ['ethereum', 'sepolia', 'polygon', 'bsc'] },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const network = request.params.network || 'ethereum';
      
      const blockNumber = await blockchainService.getBlockNumber(network);
      
      if (blockNumber === null) {
        throw new ValidationError('Failed to retrieve block number');
      }

      await reply.send({
        success: true,
        data: { 
          network,
          blockNumber,
        },
      });
    } catch (error) {
      throw error;
    }
  });
}
