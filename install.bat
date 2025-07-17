@echo off
:: UniMatrix Enterprise Dashboard - Auto Installation Script for Windows
:: Author: UniMatrix Team
:: Version: 1.0.0
:: Requires: Windows 10+ with Command Prompt

setlocal enabledelayedexpansion

:: Configuration
set "PROJECT_NAME=UniMatrix Enterprise Dashboard"
set "REPO_URL=https://github.com/eplord/unimatrix.git"
set "NODE_VERSION=18"
set "INSTALL_PATH=%USERPROFILE%\unimatrix"

:: Check command line arguments
set "FORCE_INSTALL=false"
set "SKIP_DEPENDENCIES=false"

:parse_args
if "%~1"=="" goto :start_install
if /i "%~1"=="--force" set "FORCE_INSTALL=true"
if /i "%~1"=="--skip-deps" set "SKIP_DEPENDENCIES=true"
if /i "%~1"=="--help" goto :show_help
if /i "%~1"=="-h" goto :show_help
shift
goto :parse_args

:show_help
echo.
echo UniMatrix Enterprise Dashboard - Windows Installation Script
echo.
echo Usage: install.bat [OPTIONS]
echo.
echo Options:
echo   --force        Force reinstall, remove existing directory
echo   --skip-deps    Skip dependency installation
echo   --help, -h     Show this help message
echo.
echo Example:
echo   install.bat --force
echo.
exit /b 0

:start_install
:: Banner
echo.
echo     ██████ ██   ██████   ██████ ██████   ████████ ██████   ████  ██ ██  ██
echo     ██     ██       ██   ██        ██    ██    ██ ██   ██   ██   ██  ████ 
echo     ██     ██    ████    ██    ████      ██    ██ ██████    ██   ██   ██  
echo     ██     ██       ██   ██       ██    ██    ██ ██   ██   ██   ██  ████ 
echo     ██████ ██████████    ██████████      ████████ ██   ██  ████  ██ ██  ██
echo.
echo     Enterprise Dashboard - Windows Auto Installation Script
echo.

echo [INFO] Starting %PROJECT_NAME% installation...
echo.

:: Check if we're in Windows 10+
ver | findstr /i "10\." >nul
if !errorlevel! neq 0 (
    ver | findstr /i "11\." >nul
    if !errorlevel! neq 0 (
        echo [ERROR] This script requires Windows 10 or later
        pause
        exit /b 1
    )
)

:: Check for admin privileges
net session >nul 2>&1
if !errorlevel! neq 0 (
    echo [WARNING] Running without administrator privileges
    echo [WARNING] Some operations may require administrator rights
    set /p "continue=Continue anyway? (y/N): "
    if /i "!continue!" neq "y" (
        echo [INFO] Installation cancelled
        exit /b 0
    )
)

:: Install dependencies
if "%SKIP_DEPENDENCIES%"=="false" (
    call :install_chocolatey
    call :install_git
    call :install_nodejs
    call :install_global_packages
)

:: Setup project
call :clone_repository
call :install_dependencies
call :setup_environment
call :build_project
call :create_scripts
call :complete_installation

echo.
echo [SUCCESS] Installation completed successfully!
goto :eof

:: Install Chocolatey
:install_chocolatey
echo [STEP] Checking Chocolatey...
where choco >nul 2>&1
if !errorlevel! equ 0 (
    echo [INFO] Chocolatey is already installed
    goto :eof
)

echo [STEP] Installing Chocolatey package manager...
powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
if !errorlevel! neq 0 (
    echo [ERROR] Failed to install Chocolatey
    pause
    exit /b 1
)

:: Refresh PATH
call refreshenv.cmd
echo [SUCCESS] Chocolatey installed successfully
goto :eof

:: Install Git
:install_git
echo [STEP] Checking Git...
where git >nul 2>&1
if !errorlevel! equ 0 (
    echo [INFO] Git is already installed
    goto :eof
)

echo [STEP] Installing Git...
choco install git -y --no-progress
if !errorlevel! neq 0 (
    echo [ERROR] Failed to install Git
    pause
    exit /b 1
)

call refreshenv.cmd
echo [SUCCESS] Git installed successfully
goto :eof

:: Install Node.js
:install_nodejs
echo [STEP] Checking Node.js...
where node >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=* USEBACKQ" %%i in (`node --version`) do set "current_version=%%i"
    echo [INFO] Node.js !current_version! is already installed
    
    :: Simple version check (just check if it starts with v18, v19, v20, etc.)
    echo !current_version! | findstr /r "^v[12][89]" >nul
    if !errorlevel! equ 0 goto :eof
    
    echo [WARNING] Node.js version 18+ is recommended
)

echo [STEP] Installing Node.js %NODE_VERSION%...
choco install nodejs --version %NODE_VERSION% -y --no-progress
if !errorlevel! neq 0 (
    echo [ERROR] Failed to install Node.js
    pause
    exit /b 1
)

call refreshenv.cmd
echo [SUCCESS] Node.js installed successfully
goto :eof

:: Install global npm packages
:install_global_packages
echo [STEP] Installing global npm packages...

:: Check and install pm2
npm list -g pm2 >nul 2>&1
if !errorlevel! neq 0 (
    echo [INFO] Installing pm2...
    npm install -g pm2
)

:: Check and install nodemon
npm list -g nodemon >nul 2>&1
if !errorlevel! neq 0 (
    echo [INFO] Installing nodemon...
    npm install -g nodemon
)

:: Check and install typescript
npm list -g typescript >nul 2>&1
if !errorlevel! neq 0 (
    echo [INFO] Installing typescript...
    npm install -g typescript
)

echo [SUCCESS] Global packages installed
goto :eof

:: Clone repository
:clone_repository
echo [STEP] Setting up UniMatrix repository...

if exist "%INSTALL_PATH%" (
    if "%FORCE_INSTALL%"=="true" (
        echo [WARNING] Removing existing directory: %INSTALL_PATH%
        rmdir /s /q "%INSTALL_PATH%"
    ) else (
        set /p "remove=Directory %INSTALL_PATH% already exists. Remove it and clone fresh? (y/N): "
        if /i "!remove!"=="y" (
            rmdir /s /q "%INSTALL_PATH%"
        ) else (
            echo [INFO] Using existing directory
            cd /d "%INSTALL_PATH%"
            goto :eof
        )
    )
)

echo [INFO] Cloning UniMatrix repository to %INSTALL_PATH%...
git clone %REPO_URL% "%INSTALL_PATH%"
if !errorlevel! neq 0 (
    echo [ERROR] Failed to clone repository
    pause
    exit /b 1
)

cd /d "%INSTALL_PATH%"
echo [SUCCESS] Repository cloned successfully
goto :eof

:: Install project dependencies
:install_dependencies
echo [STEP] Installing project dependencies...

echo [INFO] Installing root dependencies...
npm install
if !errorlevel! neq 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

echo [INFO] Installing core package dependencies...
cd packages\core
npm install
if !errorlevel! neq 0 (
    echo [ERROR] Failed to install core dependencies
    pause
    exit /b 1
)
cd ..\..

echo [INFO] Installing dashboard package dependencies...
cd packages\dashboard
npm install
if !errorlevel! neq 0 (
    echo [ERROR] Failed to install dashboard dependencies
    pause
    exit /b 1
)
cd ..\..

echo [INFO] Installing shared package dependencies...
cd packages\shared
npm install
if !errorlevel! neq 0 (
    echo [ERROR] Failed to install shared dependencies
    pause
    exit /b 1
)
cd ..\..

echo [SUCCESS] All project dependencies installed
goto :eof

:: Setup environment
:setup_environment
echo [STEP] Setting up environment configuration...

if not exist "packages\core\.env" (
    echo [INFO] Creating core environment file...
    copy "packages\core\.env.example" "packages\core\.env"
    
    :: Generate a simple JWT secret (not cryptographically secure, but works)
    set "jwt_secret="
    for /l %%i in (1,1,64) do (
        set /a "rand=!random! %% 36"
        if !rand! lss 10 (
            set "jwt_secret=!jwt_secret!!rand!"
        ) else (
            set /a "rand=!rand! - 10 + 65"
            for %%j in (!rand!) do set "jwt_secret=!jwt_secret!%%j"
        )
    )
    
    :: Replace placeholder in .env file
    powershell -Command "(gc packages\core\.env) -replace 'your-jwt-secret', '%jwt_secret%' | Out-File -encoding ASCII packages\core\.env"
    
    echo [SUCCESS] Environment file created with generated JWT secret
) else (
    echo [INFO] Environment file already exists
)
goto :eof

:: Build project
:build_project
echo [STEP] Building project...

echo [INFO] Building shared package...
cd packages\shared
npm run build
if !errorlevel! neq 0 (
    echo [ERROR] Failed to build shared package
    pause
    exit /b 1
)
cd ..\..

echo [INFO] Building core package...
cd packages\core
npm run build
if !errorlevel! neq 0 (
    echo [ERROR] Failed to build core package
    pause
    exit /b 1
)
cd ..\..

echo [INFO] Building dashboard package...
cd packages\dashboard
npm run build
if !errorlevel! neq 0 (
    echo [ERROR] Failed to build dashboard package
    pause
    exit /b 1
)
cd ..\..

echo [SUCCESS] Project built successfully
goto :eof

:: Create startup scripts
:create_scripts
echo [STEP] Creating startup scripts...

:: Quick start batch file
echo @echo off > quick-start.bat
echo echo Starting UniMatrix Enterprise Dashboard... >> quick-start.bat
echo. >> quick-start.bat
echo REM Check if ports are in use >> quick-start.bat
echo netstat -an ^| find ":3001" ^>nul >> quick-start.bat
echo if %%errorlevel%% == 0 ( >> quick-start.bat
echo     echo Port 3001 is already in use. Please stop the existing service or change the port. >> quick-start.bat
echo     pause >> quick-start.bat
echo     exit /b 1 >> quick-start.bat
echo ^) >> quick-start.bat
echo. >> quick-start.bat
echo netstat -an ^| find ":3002" ^>nul >> quick-start.bat
echo if %%errorlevel%% == 0 ( >> quick-start.bat
echo     echo Port 3002 is already in use. Please stop the existing service or change the port. >> quick-start.bat
echo     pause >> quick-start.bat
echo     exit /b 1 >> quick-start.bat
echo ^) >> quick-start.bat
echo. >> quick-start.bat
echo echo Starting backend on port 3001... >> quick-start.bat
echo start "UniMatrix Backend" cmd /k "cd packages\core && npm run dev" >> quick-start.bat
echo. >> quick-start.bat
echo echo Starting frontend on port 3002... >> quick-start.bat
echo start "UniMatrix Frontend" cmd /k "cd packages\dashboard && npm run dev" >> quick-start.bat
echo. >> quick-start.bat
echo echo. >> quick-start.bat
echo echo 🚀 UniMatrix is starting up... >> quick-start.bat
echo echo 📊 Backend API: http://localhost:3001 >> quick-start.bat
echo echo 🎨 Frontend Dashboard: http://localhost:3002 >> quick-start.bat
echo echo 📖 API Documentation: http://localhost:3001/docs >> quick-start.bat
echo echo. >> quick-start.bat
echo echo Press any key to exit... >> quick-start.bat
echo pause ^>nul >> quick-start.bat

echo [SUCCESS] Startup scripts created
goto :eof

:: Complete installation
:complete_installation
echo [STEP] Finalizing installation...

:: Create quick start guide
(
echo # UniMatrix Quick Start Guide for Windows
echo.
echo ## Quick Start
echo.
echo Start both backend and frontend:
echo ```cmd
echo quick-start.bat
echo ```
echo.
echo ## Manual Start
echo.
echo ```cmd
echo REM Backend only ^(port 3001^)
echo cd packages\core
echo npm run dev
echo.
echo REM Frontend only ^(port 3002^) - in a new terminal
echo cd packages\dashboard
echo npm run dev
echo ```
echo.
echo ## Accessing the Application
echo.
echo - **Frontend Dashboard**: http://localhost:3002
echo - **Backend API**: http://localhost:3001
echo - **API Documentation**: http://localhost:3001/docs
echo - **Health Check**: http://localhost:3001/health
echo.
echo ## Default Credentials
echo.
echo - **Email**: admin@unimatrix.dev
echo - **Password**: admin123
echo.
echo For more information, see the main README.md file.
) > QUICK_START_WINDOWS.md

echo [SUCCESS] Quick start guide created

:: Final message
echo.
echo [SUCCESS] 🎉 Installation completed successfully!
echo.
echo [INFO] 📁 Installation directory: %CD%
echo [INFO] 📖 Quick start guide: QUICK_START_WINDOWS.md
echo.
echo [INFO] 🚀 To start UniMatrix:
echo [INFO]    quick-start.bat              # Development mode
echo.
echo [INFO] 🌐 Access URLs:
echo [INFO]    Frontend: http://localhost:3002
echo [INFO]    Backend API: http://localhost:3001
echo [INFO]    API Docs: http://localhost:3001/docs
echo.
echo [INFO] Happy coding! 🚀
echo.
pause
goto :eof
