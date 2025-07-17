# UniMatrix Enterprise Dashboard

🚀 **A comprehensive enterprise-grade management system with AI Models, Analytics, IoT, Blockchain, and Plugin management capabilities.**

![UniMatrix Dashboard](https://img.shields.io/badge/Status-Active%20Development-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Vue.js](https://img.shields.io/badge/Vue.js-3.0+-green)
![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen)

## ✨ Features

### 🤖 Advanced AI Models Management
- **Multi-Provider Support**: OpenAI, Anthropic, Local Models
- **Real-time Monitoring**: Live performance metrics and usage tracking
- **Interactive Chat Interface**: Direct interaction with AI models
- **Model Performance Analytics**: Response times, accuracy metrics, usage patterns
- **Favorites System**: Star and organize frequently used models
- **Grid/List Views**: Flexible display options for model management

### 📊 Comprehensive Analytics
- **Real-time Dashboards**: Interactive charts and metrics
- **Performance Monitoring**: System health and usage analytics
- **Time-range Analysis**: Hourly, daily, weekly, and monthly views
- **Detailed Reporting**: Comprehensive analytics tables and trends
- **Custom Metrics**: Configurable performance indicators

### 🌐 IoT Device Management
- **Device Discovery**: Automatic detection and registration
- **Real-time Control**: Remote device management and automation
- **Environmental Monitoring**: Temperature, humidity, air quality sensors
- **Automation Rules**: Smart home and office automation
- **Energy Analytics**: Usage patterns and optimization insights
- **Scene Management**: Pre-configured device scenarios

### ⛓️ Blockchain Integration
- **Multi-chain Support**: Ethereum, Polygon, BSC, and more
- **Wallet Management**: Secure wallet creation and management
- **DeFi Integration**: Decentralized finance protocol interactions
- **Smart Contracts**: Deploy and interact with smart contracts
- **Transaction History**: Comprehensive blockchain transaction tracking
- **Portfolio Analytics**: Asset management and performance tracking

### 🔌 Plugin Ecosystem
- **Plugin Marketplace**: Discover and install community plugins
- **Development Kit**: Tools for creating custom plugins
- **API Extensions**: Extend functionality with custom APIs
- **Hot Reloading**: Dynamic plugin loading without restarts
- **Security Sandbox**: Secure plugin execution environment

### ⚙️ Advanced Settings
- **User Management**: Role-based access control
- **Security Configuration**: Authentication and authorization settings
- **Network Configuration**: API endpoints and connectivity
- **Database Management**: Data storage and backup options
- **Theme Customization**: Light/dark mode and UI customization

## 🚀 Quick Start

### One-Command Installation

**Linux/macOS:**
```bash
curl -fsSL https://raw.githubusercontent.com/eplord/unimatrix/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/eplord/unimatrix/main/install.ps1" -OutFile "install.ps1"
.\install.ps1
```

**Windows (Command Prompt):**
```cmd
curl -o install.bat https://raw.githubusercontent.com/eplord/unimatrix/main/install.bat
install.bat
```

### Quick Usage

After installation, start UniMatrix:

**Development Mode:**
```bash
# Linux/macOS
./start.sh

# Windows
quick-start.bat
# or
.\start.ps1
```

**Production Mode:**
```bash
# All platforms
./start-production.sh   # Linux/macOS
.\start-production.ps1  # Windows
```

**Access Points:**
- 🎨 **Frontend Dashboard**: http://localhost:3002
- 📊 **Backend API**: http://localhost:3001
- 📖 **API Documentation**: http://localhost:3001/docs
- ❤️ **Health Check**: http://localhost:3001/health

**Default Login:**
- **Email**: admin@unimatrix.dev
- **Password**: admin123

### Manual Installation

If you prefer manual setup:

```bash
# Clone the repository
git clone https://github.com/eplord/unimatrix.git
cd unimatrix

# Install dependencies
npm install

# Install individual package dependencies
cd packages/core && npm install
cd ../dashboard && npm install
cd ../shared && npm install
cd ../..

# Start development servers
npm run dev
```

### Development Servers

The application runs on two development servers:

- **Backend API**: http://localhost:3001
  - API Documentation: http://localhost:3001/docs
  - Health Check: http://localhost:3001/health

- **Frontend Dashboard**: http://localhost:3002
  - Main Application Interface

## 🏗️ Architecture

UniMatrix follows a modern monorepo architecture with three main packages:

```
unimatrix/
├── packages/
│   ├── core/          # Backend API server
│   │   ├── src/
│   │   │   ├── api/       # REST API routes
│   │   │   ├── services/  # Business logic
│   │   │   ├── middleware/# Express middleware
│   │   │   └── config/    # Configuration
│   │   └── plugins/   # Server-side plugins
│   │
│   ├── dashboard/     # Frontend Vue.js application
│   │   ├── src/
│   │   │   ├── views/     # Page components
│   │   │   ├── components/# Reusable components
│   │   │   ├── stores/    # Pinia state management
│   │   │   ├── router/    # Vue Router configuration
│   │   │   └── services/  # API communication
│   │
│   └── shared/        # Shared utilities and types
│       ├── src/
│       │   ├── types/     # TypeScript interfaces
│       │   ├── utils/     # Common utilities
│       │   └── config/    # Shared configuration
```

### Technology Stack

**Backend (Core)**
- **Framework**: Express.js with TypeScript
- **Database**: SQLite with Prisma ORM
- **Caching**: Redis (with mock fallback)
- **Authentication**: JWT-based auth system
- **API Documentation**: Swagger/OpenAPI
- **Real-time**: WebSocket support

**Frontend (Dashboard)**
- **Framework**: Vue.js 3 with Composition API
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **State Management**: Pinia
- **Routing**: Vue Router
- **Build Tool**: Vite

**Shared**
- **Language**: TypeScript
- **Utilities**: Common helpers, validators, security utils
- **Types**: Shared interface definitions

## 📦 Installation Scripts

UniMatrix includes comprehensive installation automation for all major platforms:

### Available Scripts

| Script | Platform | Description |
|--------|----------|-------------|
| `install.sh` | Linux/macOS | Bash script with auto dependency management |
| `install.ps1` | Windows | PowerShell script with Chocolatey integration |
| `install.bat` | Windows | Batch script for fallback compatibility |

### Features
- ✅ **Automated Dependencies**: Node.js, Git, npm, PM2, TypeScript
- ✅ **Package Managers**: apt/yum, Homebrew, Chocolatey integration
- ✅ **Environment Setup**: Auto-generated JWT secrets and .env files
- ✅ **Project Building**: Builds all TypeScript packages automatically
- ✅ **Startup Scripts**: Creates platform-specific launch scripts
- ✅ **Error Handling**: Comprehensive error checking and user guidance

### Script Options

**Linux/macOS (`install.sh`):**
```bash
./install.sh --install-path /custom/path --force --skip-deps
```

**Windows PowerShell (`install.ps1`):**
```powershell
.\install.ps1 -InstallPath "C:\UniMatrix" -Force -SkipDependencies
```

**Windows Batch (`install.bat`):**
```cmd
install.bat --force --skip-deps
```

For detailed installation instructions, see [INSTALLATION.md](INSTALLATION.md).

## 🎯 Key Features Highlight

### Enhanced AI Models Interface
- **Provider Status Cards**: Real-time monitoring of OpenAI, Anthropic, and Local Models
- **Interactive Model Grid**: Comprehensive model information with metrics
- **Advanced Chat System**: Multi-model chat with temperature controls
- **Performance Monitoring**: Real-time latency and accuracy tracking
- **Quick Prompts**: Pre-defined prompts for common tasks

### Modern UI/UX
- **Consistent Design System**: Unified spacing, colors, and components
- **Dark Mode Support**: Full dark/light theme switching
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Smooth Animations**: CSS transitions and hover effects
- **Accessibility**: WCAG compliant interface elements

### Developer Experience
- **Hot Reloading**: Instant development feedback
- **TypeScript**: Full type safety across the application
- **ESLint**: Code quality and consistency
- **Modular Architecture**: Clean separation of concerns
- **Comprehensive Documentation**: Inline code documentation

## 📝 API Documentation

The API documentation is automatically generated and available at:
- Development: http://localhost:3001/docs
- Production: [Your production URL]/docs

### Key API Endpoints

```
Authentication:
POST   /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/auth/me

AI Models:
GET    /api/v1/ai/models
POST   /api/v1/ai/chat
GET    /api/v1/ai/providers

Analytics:
GET    /api/v1/analytics/metrics
GET    /api/v1/analytics/system
GET    /api/v1/analytics/performance

IoT Devices:
GET    /api/v1/iot/devices
POST   /api/v1/iot/devices
PUT    /api/v1/iot/devices/:id

Blockchain:
GET    /api/v1/blockchain/networks
GET    /api/v1/blockchain/wallets
POST   /api/v1/blockchain/transactions

Plugins:
GET    /api/v1/plugins
POST   /api/v1/plugins/install
DELETE /api/v1/plugins/:id
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start all development servers
npm run dev:core         # Start backend only
npm run dev:dashboard    # Start frontend only

# Building
npm run build           # Build all packages
npm run build:core      # Build backend
npm run build:dashboard # Build frontend

# Testing
npm run test           # Run all tests
npm run test:core      # Test backend
npm run test:dashboard # Test frontend

# Linting
npm run lint          # Lint all packages
npm run lint:fix      # Fix linting issues
```

### Environment Variables

Create `.env` files in the appropriate packages:

**packages/core/.env**
```env
PORT=3001
DATABASE_URL="file:./src/prisma/dev.db"
JWT_SECRET="your-jwt-secret"
REDIS_URL="redis://localhost:6379"

# AI Provider API Keys (optional for development)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
HUGGINGFACE_API_KEY="your-huggingface-key"

# Blockchain RPC URLs (optional)
ETHEREUM_RPC_URL="your-ethereum-rpc"
POLYGON_RPC_URL="your-polygon-rpc"
BSC_RPC_URL="your-bsc-rpc"
```

## 🛠️ Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using ports 3001/3002
lsof -i :3001    # Linux/macOS
netstat -an | find ":3001"  # Windows

# Kill processes if needed
sudo lsof -ti:3001 | xargs kill -9  # Linux/macOS
taskkill /F /PID <PID>               # Windows
```

#### Node.js Version Issues
```bash
# Check current version
node --version

# Update Node.js
# Linux/macOS: Use nvm or package manager
# Windows: Download from nodejs.org or use chocolatey
choco upgrade nodejs  # Windows with Chocolatey
```

#### Dependency Issues
```bash
# Clean install
rm -rf node_modules package-lock.json  # Linux/macOS
rmdir /s node_modules & del package-lock.json  # Windows

# Reinstall
npm install
```

#### Permission Issues
```bash
# Linux/macOS - Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Windows - Run as Administrator
Right-click PowerShell → "Run as Administrator"
```

For more troubleshooting help, see [INSTALLATION.md](INSTALLATION.md).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Vue.js team for the amazing framework
- Tailwind CSS for the utility-first styling approach
- Heroicons for the beautiful icon set
- OpenAI and Anthropic for AI model integrations
- The open-source community for inspiration and tools

## 📞 Support

- 📫 **Issues**: [GitHub Issues](https://github.com/eplord/unimatrix/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/eplord/unimatrix/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/eplord/unimatrix/wiki)

---

**Built with ❤️ by the UniMatrix Team**
