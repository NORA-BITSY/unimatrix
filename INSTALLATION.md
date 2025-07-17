# UniMatrix Installation Scripts

This directory contains automated installation scripts for easy deployment of UniMatrix Enterprise Dashboard across different operating systems.

## Available Scripts

### Linux/macOS
- **`install.sh`** - Comprehensive bash script for Linux and macOS
- Automatically installs Node.js, npm, and all dependencies
- Sets up environment configuration
- Builds the project and creates startup scripts

### Windows
- **`install.ps1`** - PowerShell script for Windows (recommended)
- **`install.bat`** - Batch script for Windows (fallback)
- Both scripts handle Chocolatey, Node.js, and dependency installation
- Creates Windows-specific startup scripts

## Quick Installation

### Linux/macOS
```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/eplord/unimatrix/main/install.sh | bash

# Or clone and run locally
git clone https://github.com/eplord/unimatrix.git
cd unimatrix
chmod +x install.sh
./install.sh
```

### Windows (PowerShell - Recommended)
```powershell
# Download and run (requires execution policy change)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/eplord/unimatrix/main/install.ps1" -OutFile "install.ps1"
.\install.ps1

# Or clone and run locally
git clone https://github.com/eplord/unimatrix.git
cd unimatrix
.\install.ps1
```

### Windows (Batch File)
```cmd
# Download and run
curl -o install.bat https://raw.githubusercontent.com/eplord/unimatrix/main/install.bat
install.bat

# Or clone and run locally
git clone https://github.com/eplord/unimatrix.git
cd unimatrix
install.bat
```

## Script Options

### install.sh (Linux/macOS)
```bash
./install.sh [OPTIONS]

Options:
  --install-path PATH     Set custom installation directory (default: ~/unimatrix)
  --force                 Force reinstall, remove existing directory
  --skip-deps            Skip dependency installation
  --help, -h             Show help message

Examples:
  ./install.sh --install-path /opt/unimatrix
  ./install.sh --force --skip-deps
```

### install.ps1 (Windows PowerShell)
```powershell
.\install.ps1 [Parameters]

Parameters:
  -InstallPath PATH      Set custom installation directory (default: $env:USERPROFILE\unimatrix)
  -Force                 Force reinstall, remove existing directory
  -SkipDependencies      Skip dependency installation

Examples:
  .\install.ps1 -InstallPath "C:\UniMatrix"
  .\install.ps1 -Force -SkipDependencies
```

### install.bat (Windows Batch)
```cmd
install.bat [OPTIONS]

Options:
  --force                Force reinstall, remove existing directory
  --skip-deps           Skip dependency installation
  --help, -h            Show help message

Examples:
  install.bat --force
  install.bat --skip-deps
```

## What the Scripts Do

### 1. System Dependencies
- **Node.js 18+** - JavaScript runtime
- **npm** - Package manager
- **Git** - Version control
- **PM2** - Process manager (global)
- **TypeScript** - Type checking (global)
- **Nodemon** - Development tool (global)

### 2. Package Managers
- **Linux**: Uses system package manager (apt, yum, brew, etc.)
- **macOS**: Installs Homebrew if not present
- **Windows**: Installs Chocolatey for package management

### 3. Project Setup
- Clones the UniMatrix repository
- Installs all npm dependencies for each package
- Sets up environment configuration files
- Builds all TypeScript packages
- Creates platform-specific startup scripts

### 4. Generated Files
After installation, you'll have:
- **Startup scripts** for development and production modes
- **Environment files** with generated secrets
- **Quick start guides** for your platform
- **Built packages** ready to run

## Post-Installation

### Development Mode
```bash
# Linux/macOS
./start-dev.sh

# Windows
quick-start.bat
# or
.\start.ps1
```

### Production Mode
```bash
# All platforms
npm run start:prod

# Or use PM2 directly
pm2 start ecosystem.config.js
```

### Access Points
- **Frontend Dashboard**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs
- **Health Check**: http://localhost:3001/health

## Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Linux/macOS - Fix script permissions
chmod +x install.sh
sudo ./install.sh  # If system packages need root

# Windows - Run as Administrator
Right-click PowerShell → "Run as Administrator"
```

#### Node.js Version Issues
```bash
# Check current version
node --version

# Linux/macOS - Update Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows - Update via Chocolatey
choco upgrade nodejs
```

#### Port Conflicts
```bash
# Check what's using ports 3001/3002
netstat -tulpn | grep :3001  # Linux/macOS
netstat -an | find ":3001"   # Windows

# Kill processes if needed
sudo lsof -ti:3001 | xargs kill -9  # Linux/macOS
taskkill /F /PID <PID>               # Windows
```

#### Clean Installation
```bash
# Remove and reinstall
rm -rf ~/unimatrix        # Linux/macOS
rmdir /s unimatrix        # Windows

# Then run installer again
```

### Platform-Specific Issues

#### Linux
- **Missing build tools**: `sudo apt-get install build-essential`
- **Python not found**: `sudo apt-get install python3`
- **SQLite issues**: `sudo apt-get install sqlite3 libsqlite3-dev`

#### macOS
- **Xcode tools**: `xcode-select --install`
- **Homebrew issues**: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Permissions**: `sudo chown -R $(whoami) /usr/local/lib/node_modules`

#### Windows
- **PowerShell execution policy**: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
- **Windows Defender**: Add installation folder to exclusions
- **Visual Studio Build Tools**: May be required for some native modules

## Environment Configuration

After installation, customize your setup by editing:

### Backend Configuration
Edit `packages/core/.env`:
```env
# Database
DATABASE_URL=sqlite:./data/unimatrix.db

# JWT Secret (auto-generated)
JWT_SECRET=your-generated-secret

# AI Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Blockchain
ETHEREUM_RPC_URL=your-ethereum-rpc
POLYGON_RPC_URL=your-polygon-rpc
```

### Frontend Configuration
Edit `packages/dashboard/.env`:
```env
# API Endpoint
VITE_API_URL=http://localhost:3001

# Environment
VITE_NODE_ENV=development
```

## Development

### Adding New Dependencies
```bash
# Root dependencies
npm install <package>

# Core package
cd packages/core && npm install <package>

# Dashboard package
cd packages/dashboard && npm install <package>

# Shared package
cd packages/shared && npm install <package>
```

### Building
```bash
# Build all packages
npm run build

# Build specific package
npm run build:core
npm run build:dashboard
npm run build:shared
```

### Testing
```bash
# Run all tests
npm test

# Run tests for specific package
npm run test:core
npm run test:dashboard
```

## Support

If you encounter issues with the installation scripts:

1. **Check the logs** - Scripts output detailed information
2. **Verify prerequisites** - Ensure your system meets requirements
3. **Run with elevated privileges** - Some operations need admin/root
4. **Check network connectivity** - Downloads require internet access
5. **Review platform-specific guides** - Each OS has unique requirements

For additional help:
- **GitHub Issues**: https://github.com/eplord/unimatrix/issues
- **Documentation**: See main README.md and docs/ folder
- **Examples**: Check examples/ directory for reference implementations

## Contributing

To improve the installation scripts:

1. Fork the repository
2. Make your changes to the appropriate script
3. Test on the target platform
4. Submit a pull request with detailed description

Please ensure your changes maintain compatibility across all supported platforms.
