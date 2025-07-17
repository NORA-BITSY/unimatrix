<template>
  <div class="blockchain-view p-6 space-y-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Blockchain Dashboard
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        Multi-chain wallet management and DeFi integration
      </p>
    </div>

    <!-- Network Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="network in networks"
        :key="network.name"
        class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center',
                network.color
              ]"
            >
              <span class="text-white font-bold text-sm">{{ network.symbol }}</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ network.name }}
              </h3>
            </div>
          </div>
          <div
            :class="[
              'w-3 h-3 rounded-full',
              network.status === 'connected' ? 'bg-green-500' : 
              network.status === 'slow' ? 'bg-yellow-500' : 'bg-red-500'
            ]"
          ></div>
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Block Height</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ network.blockHeight }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Gas Price</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ network.gasPrice }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Balance</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ network.balance }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Wallets and Transactions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Wallet Overview -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Wallet Overview
            </h3>
            <button
              @click="connectWallet"
              class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Connect Wallet
            </button>
          </div>
        </div>

        <div class="p-6">
          <div v-if="!walletConnected" class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-gray-400 rounded-full flex items-center justify-center">
              <span class="text-white text-2xl">💳</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 font-medium">No wallet connected</p>
            <p class="text-sm text-gray-500 dark:text-gray-500">Connect your wallet to get started</p>
          </div>

          <div v-else class="space-y-4">
            <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">Wallet Address</span>
                <button
                  @click="copyAddress"
                  class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  📋
                </button>
              </div>
              <p class="text-sm font-mono text-gray-900 dark:text-white break-all">
                {{ walletAddress }}
              </p>
            </div>

            <div class="space-y-3">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Token Balances</h4>
              <div
                v-for="token in tokenBalances"
                :key="token.symbol"
                class="flex items-center justify-between py-2"
              >
                <div class="flex items-center space-x-3">
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
                      token.color
                    ]"
                  >
                    {{ token.symbol.substring(0, 2) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ token.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ token.symbol }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ token.balance }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">${{ token.usdValue }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Transactions
          </h3>
        </div>

        <div class="p-6">
          <div v-if="transactions.length === 0" class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-gray-400 rounded-full flex items-center justify-center">
              <span class="text-white text-2xl">📄</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 font-medium">No transactions yet</p>
            <p class="text-sm text-gray-500 dark:text-gray-500">Your transaction history will appear here</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="tx in transactions"
              :key="tx.hash"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    tx.type === 'send' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
                  ]"
                >
                  <span
                    :class="[
                      'text-lg',
                      tx.type === 'send' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    ]"
                  >
                    {{ tx.type === 'send' ? '↑' : '↓' }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ tx.type === 'send' ? 'Sent' : 'Received' }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ tx.timestamp }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ tx.amount }} {{ tx.token }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${{ tx.usdValue }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DeFi Integration -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
          DeFi Integration
        </h3>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="protocol in defiProtocols"
            :key="protocol.name"
            class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex items-center space-x-3 mb-4">
              <div
                :class="[
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  protocol.color
                ]"
              >
                <span class="text-white text-lg">{{ protocol.icon }}</span>
              </div>
              <div>
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ protocol.name }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ protocol.type }}
                </p>
              </div>
            </div>

            <div class="space-y-2 mb-4">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">TVL</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ protocol.tvl }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">APY</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ protocol.apy }}</span>
              </div>
            </div>

            <button
              @click="interactWithProtocol(protocol)"
              :disabled="!walletConnected"
              class="w-full px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ protocol.action }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Smart Contract Interaction -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
          Smart Contract Interaction
        </h3>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contract Address
            </label>
            <input
              v-model="contractAddress"
              type="text"
              placeholder="0x..."
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Function Name
            </label>
            <input
              v-model="functionName"
              type="text"
              placeholder="balanceOf"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Parameters (JSON)
          </label>
          <textarea
            v-model="functionParams"
            rows="3"
            placeholder='["0x123..."]'
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          ></textarea>
        </div>

        <div class="flex space-x-3 mt-6">
          <button
            @click="callContract('read')"
            :disabled="!contractAddress || !functionName"
            class="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Read
          </button>
          <button
            @click="callContract('write')"
            :disabled="!contractAddress || !functionName || !walletConnected"
            class="px-6 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Write
          </button>
        </div>

        <div v-if="contractResult" class="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Result:</h4>
          <pre class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ contractResult }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Blockchain networks
const networks = ref([
  {
    name: 'Ethereum',
    symbol: 'ETH',
    status: 'connected',
    blockHeight: '18,542,123',
    gasPrice: '25 gwei',
    balance: '2.45 ETH',
    color: 'bg-blue-500'
  },
  {
    name: 'Polygon',
    symbol: 'MATIC',
    status: 'connected',
    blockHeight: '49,123,456',
    gasPrice: '30 gwei',
    balance: '150.2 MATIC',
    color: 'bg-purple-500'
  },
  {
    name: 'BSC',
    symbol: 'BNB',
    status: 'connected',
    blockHeight: '33,234,567',
    gasPrice: '5 gwei',
    balance: '0.85 BNB',
    color: 'bg-yellow-500'
  },
  {
    name: 'Arbitrum',
    symbol: 'ARB',
    status: 'slow',
    blockHeight: '145,678,901',
    gasPrice: '0.1 gwei',
    balance: '12.3 ARB',
    color: 'bg-blue-400'
  }
])

// Wallet state
const walletConnected = ref(false)
const walletAddress = ref('0x742d35Cc6434C0532925a3b8D659C0dC9De0C123')

// Token balances
const tokenBalances = ref([
  { name: 'Ethereum', symbol: 'ETH', balance: '2.45', usdValue: '4,890.00', color: 'bg-blue-500' },
  { name: 'USD Coin', symbol: 'USDC', balance: '1,250.00', usdValue: '1,250.00', color: 'bg-blue-400' },
  { name: 'Polygon', symbol: 'MATIC', balance: '150.2', usdValue: '120.16', color: 'bg-purple-500' },
  { name: 'Binance Coin', symbol: 'BNB', balance: '0.85', usdValue: '255.00', color: 'bg-yellow-500' }
])

// Recent transactions
const transactions = ref([
  {
    hash: '0xabc123...',
    type: 'send',
    amount: '0.5',
    token: 'ETH',
    usdValue: '998.00',
    timestamp: '2 hours ago'
  },
  {
    hash: '0xdef456...',
    type: 'receive',
    amount: '100',
    token: 'USDC',
    usdValue: '100.00',
    timestamp: '1 day ago'
  },
  {
    hash: '0xghi789...',
    type: 'send',
    amount: '25.5',
    token: 'MATIC',
    usdValue: '20.40',
    timestamp: '3 days ago'
  }
])

// DeFi protocols
const defiProtocols = ref([
  {
    name: 'Uniswap',
    type: 'DEX',
    tvl: '$4.2B',
    apy: '12.5%',
    action: 'Swap',
    color: 'bg-pink-500',
    icon: '💱'
  },
  {
    name: 'Aave',
    type: 'Lending',
    tvl: '$8.1B',
    apy: '5.2%',
    action: 'Lend',
    color: 'bg-blue-600',
    icon: '🏦'
  },
  {
    name: 'Compound',
    type: 'Lending',
    tvl: '$2.8B',
    apy: '4.8%',
    action: 'Supply',
    color: 'bg-green-500',
    icon: '📊'
  }
])

// Smart contract interaction
const contractAddress = ref('')
const functionName = ref('')
const functionParams = ref('')
const contractResult = ref('')

// Methods
function connectWallet() {
  // Simulate wallet connection
  walletConnected.value = true
  console.log('Wallet connected')
}

function copyAddress() {
  navigator.clipboard.writeText(walletAddress.value)
  console.log('Address copied to clipboard')
}

function interactWithProtocol(protocol: any) {
  console.log('Interacting with protocol:', protocol.name)
  // Implement DeFi protocol interaction
}

function callContract(type: 'read' | 'write') {
  console.log(`${type} contract:`, contractAddress.value, functionName.value)
  
  // Simulate contract call
  contractResult.value = `${type} call result: Success\nFunction: ${functionName.value}\nParameters: ${functionParams.value || 'none'}`
}

onMounted(() => {
  console.log('Blockchain view mounted')
})
</script>

<style scoped>
.blockchain-view {
  min-height: 100vh;
}
</style>
