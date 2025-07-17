# UniMatrix Enterprise Dashboard - Auto Installation Script for Windows
# Author: UniMatrix Team
# Version: 1.0.0
# Requires: PowerShell 5.0+ and Windows 10+

param(
    [string]$InstallPath = "$env:USERPROFILE\unimatrix",
    [switch]$Force = $false,
    [switch]$SkipDependencies = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Config = @{
    ProjectName = "UniMatrix Enterprise Dashboard"
    RepoUrl = "https://github.com/eplord/unimatrix.git"
    NodeVersion = "18"
    RequiredNodeVersion = [Version]"18.0.0"
    RequiredPowerShellVersion = [Version]"5.0"
}

# Color output functions
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$ForegroundColor = "White"
    )
    Write-Host $Message -ForegroundColor $ForegroundColor
}

function Write-Info { param([string]$Message) Write-ColorOutput "    [INFO] $Message" "Cyan" }
function Write-Success { param([string]$Message) Write-ColorOutput " [SUCCESS] $Message" "Green" }
function Write-Warning { param([string]$Message) Write-ColorOutput " [WARNING] $Message" "Yellow" }
function Write-Error { param([string]$Message) Write-ColorOutput "   [ERROR] $Message" "Red" }
function Write-Step { param([string]$Message) Write-ColorOutput "    [STEP] $Message" "Magenta" }

# Banner
function Show-Banner {
    Write-Host ""
    Write-ColorOutput @"
    ██╗   ██╗███╗   ██╗██╗███╗   ███╗ █████╗ ████████╗██████╗ ██╗██╗  ██╗
    ██║   ██║████╗  ██║██║████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██║╚██╗██╔╝
    ██║   ██║██╔██╗ ██║██║██╔████╔██║███████║   ██║   ██████╔╝██║ ╚███╔╝ 
    ██║   ██║██║╚██╗██║██║██║╚██╔╝██║██╔══██║   ██║   ██╔══██╗██║ ██╔██╗ 
    ╚██████╔╝██║ ╚████║██║██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║██║██╔╝ ██╗
     ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
    
    Enterprise Dashboard - Windows Auto Installation Script
"@ "Magenta"
    Write-Host ""
}

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check PowerShell version
function Test-PowerShellVersion {
    $currentVersion = $PSVersionTable.PSVersion
    if ($currentVersion -lt $Config.RequiredPowerShellVersion) {
        Write-Error "PowerShell $($Config.RequiredPowerShellVersion) or higher is required. Current version: $currentVersion"
        exit 1
    }
    Write-Info "PowerShell version: $currentVersion ✓"
}

# Check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Install Chocolatey
function Install-Chocolatey {
    if (Test-Command "choco") {
        Write-Info "Chocolatey is already installed"
        return
    }
    
    Write-Step "Installing Chocolatey package manager..."
    
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Success "Chocolatey installed successfully"
    }
    catch {
        Write-Error "Failed to install Chocolatey: $($_.Exception.Message)"
        exit 1
    }
}

# Install Git
function Install-Git {
    if (Test-Command "git") {
        $gitVersion = (git --version) -replace 'git version ', ''
        Write-Info "Git is already installed: $gitVersion"
        return
    }
    
    Write-Step "Installing Git..."
    
    try {
        choco install git -y --no-progress
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Success "Git installed successfully"
    }
    catch {
        Write-Error "Failed to install Git: $($_.Exception.Message)"
        exit 1
    }
}

# Install Node.js
function Install-NodeJS {
    if (Test-Command "node") {
        $nodeVersionOutput = node --version
        $currentVersion = [Version]($nodeVersionOutput -replace 'v', '')
        
        if ($currentVersion -ge $Config.RequiredNodeVersion) {
            Write-Info "Node.js $nodeVersionOutput is already installed"
            return
        }
        else {
            Write-Warning "Node.js $nodeVersionOutput is installed but version $($Config.RequiredNodeVersion) or higher is required"
        }
    }
    
    Write-Step "Installing Node.js $($Config.NodeVersion)..."
    
    try {
        choco install nodejs --version $Config.NodeVersion -y --no-progress
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Verify installation
        if (Test-Command "node" -and Test-Command "npm") {
            $nodeVersion = node --version
            $npmVersion = npm --version
            Write-Success "Node.js $nodeVersion and npm $npmVersion installed successfully"
        }
        else {
            throw "Node.js or npm not found after installation"
        }
    }
    catch {
        Write-Error "Failed to install Node.js: $($_.Exception.Message)"
        exit 1
    }
}

# Install global npm packages
function Install-GlobalPackages {
    Write-Step "Installing global npm packages..."
    
    $packagesToInstall = @()
    
    # Check each package
    $requiredPackages = @("pm2", "nodemon", "typescript")
    
    foreach ($package in $requiredPackages) {
        try {
            npm list -g $package 2>$null | Out-Null
            if ($LASTEXITCODE -ne 0) {
                $packagesToInstall += $package
            }
        }
        catch {
            $packagesToInstall += $package
        }
    }
    
    if ($packagesToInstall.Count -gt 0) {
        Write-Info "Installing: $($packagesToInstall -join ', ')"
        npm install -g $packagesToInstall
        Write-Success "Global packages installed"
    }
    else {
        Write-Success "All required global packages are already installed"
    }
}

# Clone repository
function Clone-Repository {
    Write-Step "Setting up UniMatrix repository..."
    
    if (Test-Path $InstallPath) {
        if ($Force) {
            Write-Warning "Removing existing directory: $InstallPath"
            Remove-Item $InstallPath -Recurse -Force
        }
        else {
            $response = Read-Host "Directory $InstallPath already exists. Remove it and clone fresh? (y/N)"
            if ($response -match '^[Yy]$') {
                Remove-Item $InstallPath -Recurse -Force
            }
            else {
                Write-Info "Using existing directory"
                Set-Location $InstallPath
                return
            }
        }
    }
    
    Write-Info "Cloning UniMatrix repository to $InstallPath..."
    
    try {
        # Create parent directory if it doesn't exist
        $parentDir = Split-Path $InstallPath -Parent
        if (-not (Test-Path $parentDir)) {
            New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
        }
        
        git clone $Config.RepoUrl $InstallPath
        Set-Location $InstallPath
        
        Write-Success "Repository cloned successfully"
    }
    catch {
        Write-Error "Failed to clone repository: $($_.Exception.Message)"
        exit 1
    }
}

# Install project dependencies
function Install-ProjectDependencies {
    Write-Step "Installing project dependencies..."
    
    try {
        # Install root dependencies
        Write-Info "Installing root dependencies..."
        npm install
        
        # Install core package dependencies
        Write-Info "Installing core package dependencies..."
        Set-Location "packages\core"
        npm install
        Set-Location "..\..\"
        
        # Install dashboard package dependencies
        Write-Info "Installing dashboard package dependencies..."
        Set-Location "packages\dashboard"
        npm install
        Set-Location "..\..\"
        
        # Install shared package dependencies
        Write-Info "Installing shared package dependencies..."
        Set-Location "packages\shared"
        npm install
        Set-Location "..\..\"
        
        Write-Success "All project dependencies installed"
    }
    catch {
        Write-Error "Failed to install project dependencies: $($_.Exception.Message)"
        exit 1
    }
}

# Setup environment files
function Setup-Environment {
    Write-Step "Setting up environment configuration..."
    
    $envPath = "packages\core\.env"
    
    if (-not (Test-Path $envPath)) {
        Write-Info "Creating core environment file..."
        
        try {
            Copy-Item "packages\core\.env.example" $envPath
            
            # Generate JWT secret
            $jwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 0)
            
            # Update .env file
            $envContent = Get-Content $envPath -Raw
            $envContent = $envContent -replace 'your-jwt-secret', $jwtSecret
            $envContent | Set-Content $envPath
            
            Write-Success "Environment file created with generated JWT secret"
        }
        catch {
            Write-Error "Failed to setup environment: $($_.Exception.Message)"
            exit 1
        }
    }
    else {
        Write-Info "Environment file already exists"
    }
}

# Build project
function Build-Project {
    Write-Step "Building project..."
    
    try {
        # Build shared package first
        Write-Info "Building shared package..."
        Set-Location "packages\shared"
        npm run build
        Set-Location "..\..\"
        
        # Build core package
        Write-Info "Building core package..."
        Set-Location "packages\core"
        npm run build
        Set-Location "..\..\"
        
        # Build dashboard package
        Write-Info "Building dashboard package..."
        Set-Location "packages\dashboard"
        npm run build
        Set-Location "..\..\"
        
        Write-Success "Project built successfully"
    }
    catch {
        Write-Error "Failed to build project: $($_.Exception.Message)"
        exit 1
    }
}

# Create startup scripts
function Create-StartupScripts {
    Write-Step "Creating startup scripts..."
    
    # Create Windows batch start script
    $startBat = @'
@echo off
echo Starting UniMatrix Enterprise Dashboard...

REM Check if ports are in use
netstat -an | find ":3001" >nul
if %errorlevel% == 0 (
    echo Port 3001 is already in use. Please stop the existing service or change the port.
    pause
    exit /b 1
)

netstat -an | find ":3002" >nul
if %errorlevel% == 0 (
    echo Port 3002 is already in use. Please stop the existing service or change the port.
    pause
    exit /b 1
)

echo Starting backend on port 3001...
start "UniMatrix Backend" cmd /k "cd packages\core && npm run dev"

echo Starting frontend on port 3002...
start "UniMatrix Frontend" cmd /k "cd packages\dashboard && npm run dev"

echo.
echo 🚀 UniMatrix is starting up...
echo 📊 Backend API: http://localhost:3001
echo 🎨 Frontend Dashboard: http://localhost:3002
echo 📖 API Documentation: http://localhost:3001/docs
echo.
echo Press any key to exit...
pause >nul
'@
    
    $startBat | Set-Content "start.bat"
    
    # Create PowerShell start script
    $startPs1 = @'
# UniMatrix Startup Script
Write-Host "Starting UniMatrix Enterprise Dashboard..." -ForegroundColor Green

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $false
    }
    catch {
        return $true
    }
}

# Check ports
if (Test-Port 3001) {
    Write-Host "Port 3001 is already in use. Please stop the existing service or change the port." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (Test-Port 3002) {
    Write-Host "Port 3002 is already in use. Please stop the existing service or change the port." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting backend on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd packages\core; npm run dev"

Start-Sleep 2

Write-Host "Starting frontend on port 3002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd packages\dashboard; npm run dev"

Write-Host ""
Write-Host "🚀 UniMatrix is starting up..." -ForegroundColor Green
Write-Host "📊 Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🎨 Frontend Dashboard: http://localhost:3002" -ForegroundColor Cyan
Write-Host "📖 API Documentation: http://localhost:3001/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services are starting in separate windows..."
Read-Host "Press Enter to exit"
'@
    
    $startPs1 | Set-Content "start.ps1"
    
    # Create production start script
    $startProdPs1 = @'
# UniMatrix Production Startup Script
Write-Host "Starting UniMatrix in production mode..." -ForegroundColor Green

# Build if needed
if (-not (Test-Path "packages\core\dist") -or -not (Test-Path "packages\dashboard\dist")) {
    Write-Host "Building project..." -ForegroundColor Yellow
    npm run build
}

Write-Host "Starting backend with PM2..." -ForegroundColor Yellow
Set-Location "packages\core"
pm2 start npm --name "unimatrix-backend" -- start
Set-Location "..\..\"

Write-Host "Starting frontend with PM2..." -ForegroundColor Yellow
Set-Location "packages\dashboard"
pm2 start npm --name "unimatrix-frontend" -- run preview
Set-Location "..\..\"

Write-Host ""
Write-Host "🚀 UniMatrix started in production mode" -ForegroundColor Green
Write-Host "📊 Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🎨 Frontend Dashboard: http://localhost:3002" -ForegroundColor Cyan
Write-Host ""
Write-Host "Use 'pm2 status' to check status" -ForegroundColor Yellow
Write-Host "Use 'pm2 stop all' to stop all services" -ForegroundColor Yellow
Write-Host "Use 'pm2 restart all' to restart all services" -ForegroundColor Yellow
'@
    
    $startProdPs1 | Set-Content "start-production.ps1"
    
    Write-Success "Startup scripts created"
}

# Final setup and instructions
function Complete-Installation {
    Write-Step "Finalizing installation..."
    
    # Create quick start guide
    $quickStart = @'
# UniMatrix Quick Start Guide for Windows

## Development Mode

Start both backend and frontend in development mode:

### Option 1: Batch Script
```cmd
start.bat
```

### Option 2: PowerShell Script
```powershell
.\start.ps1
```

### Option 3: Manual Start
```cmd
REM Backend only (port 3001)
cd packages\core
npm run dev

REM Frontend only (port 3002) - in a new terminal
cd packages\dashboard
npm run dev
```

## Production Mode

Start with PM2 process manager:
```powershell
.\start-production.ps1
```

## Accessing the Application

- **Frontend Dashboard**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs
- **Health Check**: http://localhost:3001/health

## Default Credentials

The application will create a demo user automatically:
- **Email**: admin@unimatrix.dev
- **Password**: admin123

## Environment Configuration

Edit `packages\core\.env` to configure:
- Database settings
- AI provider API keys
- Blockchain RPC URLs
- Redis connection
- JWT secret

## Useful Commands

```cmd
REM Install dependencies
npm install

REM Build all packages
npm run build

REM Run tests
npm run test

REM Lint code
npm run lint

REM Check PM2 status
pm2 status

REM View PM2 logs
pm2 logs

REM Stop all PM2 processes
pm2 stop all
```

## Troubleshooting

1. **Port conflicts**: Change ports in the environment files
2. **Permission issues**: Run PowerShell as Administrator
3. **Node.js version**: Ensure Node.js 18+ is installed
4. **Dependencies**: Run `npm install` in each package directory
5. **Windows Defender**: Add project folder to exclusions if needed

For more information, see the main README.md file.
'@
    
    $quickStart | Set-Content "QUICK_START_WINDOWS.md"
    
    Write-Success "Quick start guide created"
    
    # Final message
    Write-Host ""
    Write-Success "🎉 Installation completed successfully!"
    Write-Host ""
    Write-Info "📁 Installation directory: $(Get-Location)"
    Write-Info "📖 Quick start guide: .\QUICK_START_WINDOWS.md"
    Write-Host ""
    Write-ColorOutput "🚀 To start UniMatrix:" "Yellow"
    Write-ColorOutput "   start.bat                     # Development mode (Batch)" "Cyan"
    Write-ColorOutput "   .\start.ps1                   # Development mode (PowerShell)" "Cyan"
    Write-ColorOutput "   .\start-production.ps1        # Production mode" "Cyan"
    Write-Host ""
    Write-ColorOutput "🌐 Access URLs:" "Yellow"
    Write-ColorOutput "   Frontend: http://localhost:3002" "Cyan"
    Write-ColorOutput "   Backend API: http://localhost:3001" "Cyan"
    Write-ColorOutput "   API Docs: http://localhost:3001/docs" "Cyan"
    Write-Host ""
    Write-ColorOutput "Happy coding! 🚀" "Green"
}

# Error handler
function Handle-Error {
    param([string]$Step)
    Write-Error "Installation failed at step: $Step"
    Write-Host "Please check the error messages above and try again." -ForegroundColor Red
    Write-Host "If you need help, please visit: https://github.com/eplord/unimatrix/issues" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Main installation function
function Start-Installation {
    Show-Banner
    
    Write-Info "Starting $($Config.ProjectName) installation..."
    Write-Host ""
    
    # Check prerequisites
    Test-PowerShellVersion
    
    if (-not (Test-Administrator)) {
        Write-Warning "Running without administrator privileges"
        Write-Host "Some operations may require administrator rights. Continue? (Y/n): " -NoNewline -ForegroundColor Yellow
        $response = Read-Host
        if ($response -match '^[Nn]$') {
            Write-Info "Installation cancelled"
            exit 0
        }
    }
    
    try {
        # Installation steps
        if (-not $SkipDependencies) {
            Install-Chocolatey
            Install-Git
            Install-NodeJS
            Install-GlobalPackages
        }
        
        Clone-Repository
        Install-ProjectDependencies
        Setup-Environment
        Build-Project
        Create-StartupScripts
        Complete-Installation
    }
    catch {
        Handle-Error "Unknown error: $($_.Exception.Message)"
    }
}

# Run main function
Start-Installation
