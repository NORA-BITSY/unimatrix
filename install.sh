#!/bin/bash

# UniMatrix Enterprise Dashboard - Auto Installation Script
# Supports: Linux and macOS
# Author: UniMatrix Team
# Version: 1.0.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="18"
REQUIRED_NODE_VERSION="18.0.0"
PROJECT_NAME="UniMatrix Enterprise Dashboard"
REPO_URL="https://github.com/eplord/unimatrix.git"

# ASCII Art Banner
print_banner() {
    echo -e "${PURPLE}"
    cat << "EOF"
    ██╗   ██╗███╗   ██╗██╗███╗   ███╗ █████╗ ████████╗██████╗ ██╗██╗  ██╗
    ██║   ██║████╗  ██║██║████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██║╚██╗██╔╝
    ██║   ██║██╔██╗ ██║██║██╔████╔██║███████║   ██║   ██████╔╝██║ ╚███╔╝ 
    ██║   ██║██║╚██╗██║██║██║╚██╔╝██║██╔══██║   ██║   ██╔══██╗██║ ██╔██╗ 
    ╚██████╔╝██║ ╚████║██║██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║██║██╔╝ ██╗
     ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
    
    Enterprise Dashboard - Auto Installation Script
EOF
    echo -e "${NC}"
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Version comparison function
version_ge() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if command_exists apt-get; then
            DISTRO="ubuntu"
        elif command_exists yum; then
            DISTRO="centos"
        elif command_exists pacman; then
            DISTRO="arch"
        else
            DISTRO="unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        DISTRO="macos"
    else
        log_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    log_info "Detected OS: $OS ($DISTRO)"
}

# Install dependencies based on OS
install_dependencies() {
    log_step "Installing system dependencies..."
    
    case $DISTRO in
        ubuntu)
            sudo apt-get update
            sudo apt-get install -y curl wget git build-essential
            ;;
        centos)
            sudo yum update -y
            sudo yum install -y curl wget git gcc gcc-c++ make
            ;;
        arch)
            sudo pacman -Sy --noconfirm curl wget git base-devel
            ;;
        macos)
            if ! command_exists brew; then
                log_info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install curl wget git
            ;;
    esac
    
    log_success "System dependencies installed"
}

# Install Node.js
install_nodejs() {
    log_step "Checking Node.js installation..."
    
    if command_exists node; then
        current_version=$(node --version | sed 's/v//')
        if version_ge "$current_version" "$REQUIRED_NODE_VERSION"; then
            log_success "Node.js $current_version is already installed"
            return
        else
            log_warning "Node.js $current_version is installed but version $REQUIRED_NODE_VERSION or higher is required"
        fi
    fi
    
    log_info "Installing Node.js $NODE_VERSION..."
    
    # Install Node.js using NodeSource repository
    if [[ "$OS" == "linux" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        case $DISTRO in
            ubuntu)
                sudo apt-get install -y nodejs
                ;;
            centos)
                sudo yum install -y nodejs npm
                ;;
        esac
    elif [[ "$OS" == "macos" ]]; then
        brew install node@${NODE_VERSION}
        brew link node@${NODE_VERSION} --force
    fi
    
    # Verify installation
    if command_exists node && command_exists npm; then
        node_version=$(node --version)
        npm_version=$(npm --version)
        log_success "Node.js $node_version and npm $npm_version installed successfully"
    else
        log_error "Failed to install Node.js"
        exit 1
    fi
}

# Install global npm packages
install_global_packages() {
    log_step "Installing global npm packages..."
    
    # Check if packages are already installed
    packages_to_install=()
    
    if ! npm list -g pm2 >/dev/null 2>&1; then
        packages_to_install+=("pm2")
    fi
    
    if ! npm list -g nodemon >/dev/null 2>&1; then
        packages_to_install+=("nodemon")
    fi
    
    if ! npm list -g typescript >/dev/null 2>&1; then
        packages_to_install+=("typescript")
    fi
    
    if [ ${#packages_to_install[@]} -gt 0 ]; then
        log_info "Installing: ${packages_to_install[*]}"
        npm install -g "${packages_to_install[@]}"
        log_success "Global packages installed"
    else
        log_success "All required global packages are already installed"
    fi
}

# Clone repository
clone_repository() {
    log_step "Setting up UniMatrix repository..."
    
    # Ask for installation directory
    echo -e "${YELLOW}Where would you like to install UniMatrix?${NC}"
    echo "Press Enter for default: $HOME/unimatrix"
    read -r INSTALL_DIR
    
    if [ -z "$INSTALL_DIR" ]; then
        INSTALL_DIR="$HOME/unimatrix"
    fi
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$INSTALL_DIR")"
    
    if [ -d "$INSTALL_DIR" ]; then
        log_warning "Directory $INSTALL_DIR already exists"
        echo -e "${YELLOW}Do you want to remove it and clone fresh? (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
        else
            log_info "Using existing directory"
            cd "$INSTALL_DIR"
            return
        fi
    fi
    
    log_info "Cloning UniMatrix repository to $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    log_success "Repository cloned successfully"
}

# Install project dependencies
install_project_dependencies() {
    log_step "Installing project dependencies..."
    
    # Install root dependencies
    log_info "Installing root dependencies..."
    npm install
    
    # Install core package dependencies
    log_info "Installing core package dependencies..."
    cd packages/core
    npm install
    cd ../..
    
    # Install dashboard package dependencies
    log_info "Installing dashboard package dependencies..."
    cd packages/dashboard
    npm install
    cd ../..
    
    # Install shared package dependencies
    log_info "Installing shared package dependencies..."
    cd packages/shared
    npm install
    cd ../..
    
    log_success "All project dependencies installed"
}

# Setup environment files
setup_environment() {
    log_step "Setting up environment configuration..."
    
    # Core environment file
    if [ ! -f "packages/core/.env" ]; then
        log_info "Creating core environment file..."
        cp packages/core/.env.example packages/core/.env
        
        # Generate JWT secret
        jwt_secret=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64)
        
        # Update .env file
        sed -i.bak "s/your-jwt-secret/$jwt_secret/g" packages/core/.env
        rm packages/core/.env.bak 2>/dev/null || true
        
        log_success "Environment file created with generated JWT secret"
    else
        log_info "Environment file already exists"
    fi
}

# Build project
build_project() {
    log_step "Building project..."
    
    # Build shared package first
    log_info "Building shared package..."
    cd packages/shared
    npm run build
    cd ../..
    
    # Build core package
    log_info "Building core package..."
    cd packages/core
    npm run build
    cd ../..
    
    # Build dashboard package
    log_info "Building dashboard package..."
    cd packages/dashboard
    npm run build
    cd ../..
    
    log_success "Project built successfully"
}

# Create startup scripts
create_startup_scripts() {
    log_step "Creating startup scripts..."
    
    # Create start script
    cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting UniMatrix Enterprise Dashboard..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Port $1 is already in use"
        return 1
    fi
    return 0
}

# Check ports
if ! check_port 3001; then
    echo "Backend port 3001 is in use. Please stop the existing service or change the port."
    exit 1
fi

if ! check_port 3002; then
    echo "Frontend port 3002 is in use. Please stop the existing service or change the port."
    exit 1
fi

echo "Starting backend on port 3001..."
cd packages/core && npm run dev &
BACKEND_PID=$!

echo "Starting frontend on port 3002..."
cd packages/dashboard && npm run dev &
FRONTEND_PID=$!

echo ""
echo "🚀 UniMatrix is starting up..."
echo "📊 Backend API: http://localhost:3001"
echo "🎨 Frontend Dashboard: http://localhost:3002"
echo "📖 API Documentation: http://localhost:3001/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "Shutting down..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
EOF
    
    chmod +x start.sh
    
    # Create production start script
    cat > start-production.sh << 'EOF'
#!/bin/bash
echo "Starting UniMatrix in production mode..."

# Build if needed
if [ ! -d "packages/core/dist" ] || [ ! -d "packages/dashboard/dist" ]; then
    echo "Building project..."
    npm run build
fi

echo "Starting backend with PM2..."
cd packages/core
pm2 start npm --name "unimatrix-backend" -- start
cd ../..

echo "Starting frontend with PM2..."
cd packages/dashboard
pm2 start npm --name "unimatrix-frontend" -- run preview
cd ../..

echo ""
echo "🚀 UniMatrix started in production mode"
echo "📊 Backend API: http://localhost:3001"
echo "🎨 Frontend Dashboard: http://localhost:3002"
echo ""
echo "Use 'pm2 status' to check status"
echo "Use 'pm2 stop all' to stop all services"
echo "Use 'pm2 restart all' to restart all services"
EOF
    
    chmod +x start-production.sh
    
    log_success "Startup scripts created"
}

# Final setup and instructions
final_setup() {
    log_step "Finalizing installation..."
    
    # Create quick start guide
    cat > QUICK_START.md << 'EOF'
# UniMatrix Quick Start Guide

## Development Mode

Start both backend and frontend in development mode:
```bash
./start.sh
```

Or start individually:
```bash
# Backend only (port 3001)
cd packages/core && npm run dev

# Frontend only (port 3002)
cd packages/dashboard && npm run dev
```

## Production Mode

Start with PM2 process manager:
```bash
./start-production.sh
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

Edit `packages/core/.env` to configure:
- Database settings
- AI provider API keys
- Blockchain RPC URLs
- Redis connection
- JWT secret

## Useful Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Check PM2 status
pm2 status

# View PM2 logs
pm2 logs

# Stop all PM2 processes
pm2 stop all
```

## Troubleshooting

1. **Port conflicts**: Change ports in the environment files
2. **Permission issues**: Run with appropriate permissions
3. **Node.js version**: Ensure Node.js 18+ is installed
4. **Dependencies**: Run `npm install` in each package directory

For more information, see the main README.md file.
EOF
    
    log_success "Quick start guide created"
    
    # Final message
    echo ""
    echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}📁 Installation directory:${NC} $(pwd)"
    echo -e "${CYAN}📖 Quick start guide:${NC} ./QUICK_START.md"
    echo ""
    echo -e "${YELLOW}🚀 To start UniMatrix:${NC}"
    echo -e "   ${BLUE}./start.sh${NC}                    # Development mode"
    echo -e "   ${BLUE}./start-production.sh${NC}        # Production mode"
    echo ""
    echo -e "${YELLOW}🌐 Access URLs:${NC}"
    echo -e "   ${BLUE}Frontend:${NC} http://localhost:3002"
    echo -e "   ${BLUE}Backend API:${NC} http://localhost:3001"
    echo -e "   ${BLUE}API Docs:${NC} http://localhost:3001/docs"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Error handler
error_handler() {
    log_error "Installation failed at step: $1"
    echo "Please check the error messages above and try again."
    echo "If you need help, please visit: https://github.com/eplord/unimatrix/issues"
    exit 1
}

# Main installation function
main() {
    print_banner
    
    log_info "Starting $PROJECT_NAME installation..."
    echo ""
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        log_warning "Running as root is not recommended"
        echo -e "${YELLOW}Continue anyway? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "Installation cancelled"
            exit 0
        fi
    fi
    
    # Installation steps
    detect_os || error_handler "OS detection"
    install_dependencies || error_handler "dependency installation"
    install_nodejs || error_handler "Node.js installation"
    install_global_packages || error_handler "global package installation"
    clone_repository || error_handler "repository cloning"
    install_project_dependencies || error_handler "project dependency installation"
    setup_environment || error_handler "environment setup"
    build_project || error_handler "project build"
    create_startup_scripts || error_handler "startup script creation"
    final_setup || error_handler "final setup"
}

# Run main function
main "$@"
