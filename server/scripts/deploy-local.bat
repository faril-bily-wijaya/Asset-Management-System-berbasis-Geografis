@echo off
REM ===========================================
REM Map Inventory - Deploy to VPS Script
REM ===========================================

echo.
echo ========================================
echo    Map Inventory - Deploy to VPS
echo ========================================
echo.

set VPS_IP=124.156.204.209
set VPS_USER=ubuntu

echo.
echo [INFO] VPS: %VPS_USER%@%VPS_IP%
echo.

REM Ask for confirmation
set /p CONFIRM="Continue with deployment? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo [CANCELLED] Deployment aborted.
    exit /b 1
)

echo.
echo [STEP 1] Creating server folder on VPS...
echo ===========================================
ssh %VPS_USER%@%VPS_IP% "mkdir -p /home/ubuntu/map-inventory/server/uploads /home/ubuntu/map-inventory/server/scripts"

echo.
echo [STEP 2] Uploading server files (excluding node_modules)...
echo ==============================================================
scp -r ..\src %VPS_USER%@%VPS_IP%:/home/ubuntu/map-inventory/server/
scp ..\package.json %VPS_USER%@%VPS_IP%:/home/ubuntu/map-inventory/server/
scp ..\.env.example %VPS_USER%@%VPS_IP%:/home/ubuntu/map-inventory/server/
scp ..\README.md %VPS_USER%@%VPS_IP%:/home/ubuntu/map-inventory/server/

echo.
echo [STEP 3] Uploading deployment scripts...
echo =============================================
scp setup-db.js %VPS_USER%@%VPS_IP%:/home/ubuntu/map-inventory/server/scripts/
scp setup-vps.sh %VPS_USER%@%VPS_IP%:/home/ubuntu/map-inventory/server/scripts/
scp migrate-json-to-db.js %VPS_USER%@%VPS_IP%:/home/ubuntu/map-inventory/server/scripts/

echo.
echo [STEP 4] Making scripts executable...
echo =====================================
ssh %VPS_USER%@%VPS_IP% "chmod +x /home/ubuntu/map-inventory/server/scripts/*.sh 2>/dev/null || true"

echo.
echo ========================================
echo    Deployment files uploaded!
echo ========================================
echo.
echo [NEXT STEPS]
echo 1. SSH to VPS: ssh %VPS_USER%@%VPS_IP%
echo 2. Navigate: cd /home/ubuntu/map-inventory/server
echo 3. Setup database: npm run setup-db
echo 4. Or run full setup: sudo ./scripts/setup-vps.sh
echo.
echo ========================================
