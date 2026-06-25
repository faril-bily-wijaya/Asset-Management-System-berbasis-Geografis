#!/bin/bash

# ===========================================
# Map Inventory API - VPS Setup Script
# ===========================================

set -e

echo "🚀 Map Inventory API - VPS Setup"
echo "=================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Please run as root (sudo)"
    exit 1
fi

# Variables
APP_DIR="/home/ubuntu/map-inventory/server"
APP_USER="ubuntu"
DB_NAME="mapinventory"
DB_USER="mapaapp"
DB_PASS="mapapp_secure_password_2024"

echo ""
echo "📦 Step 1: Installing dependencies..."
echo "======================================"

# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

echo ""
echo "📦 Step 2: Setting up PostgreSQL..."
echo "======================================"

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
su - postgres -c "psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';\"" || true
su - postgres -c "psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\"" || true
su - postgres -c "psql -c \"ALTER DATABASE $DB_NAME OWNER TO $DB_USER;\"" || true
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\"" || true
su - postgres -c "psql -d $DB_NAME -c \"GRANT ALL ON SCHEMA public TO $DB_USER;\"" || true

echo ""
echo "📦 Step 3: Setting up application directory..."
echo "================================================"

# Create app directory if not exists
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# Create uploads directory
mkdir -p $APP_DIR/uploads
chown -R $APP_USER:$APP_USER $APP_DIR/uploads

echo ""
echo "📦 Step 4: Installing Node.js dependencies..."
echo "============================================"

# Navigate to app directory
cd $APP_DIR

# Install dependencies as ubuntu user
su - $APP_USER -c "cd $APP_DIR && npm install"

echo ""
echo "📦 Step 5: Creating environment file..."
echo "========================================="

# Create .env file
cat > $APP_DIR/.env << EOF
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://124.156.204.209

DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS

JWT_SECRET=$(openssl rand -base64 32)
EOF

chown $APP_USER:$APP_USER $APP_DIR/.env

echo ""
echo "📦 Step 6: Running database setup..."
echo "====================================="

# Run database setup
su - $APP_USER -c "cd $APP_DIR && npm run setup-db"

echo ""
echo "📦 Step 7: Starting application with PM2..."
echo "============================================="

# Start with PM2
su - $APP_USER -c "cd $APP_DIR && pm2 start src/index.js --name map-inventory-api"

# Setup PM2 startup script
su - $APP_USER -c "pm2 startup"
su - $APP_USER -c "pm2 save"

echo ""
echo "📦 Step 8: Configuring Nginx..."
echo "================================="

# Backup existing nginx config
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d%H%M%S)

# Create nginx config
cat > /etc/nginx/sites-available/map-inventory-api << EOF
server {
    listen 80;
    server_name 124.156.204.209;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        root /home/ubuntu/map-inventory;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/map-inventory-api /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx

echo ""
echo "🎉 Setup completed!"
echo "==================="
echo ""
echo "📌 API URL: http://124.156.204.209/api"
echo "📌 Health Check: http://124.156.204.209/api/health"
echo ""
echo "📌 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change the admin password after first login!"
echo ""
echo "📌 Useful Commands:"
echo "   View logs: pm2 logs map-inventory-api"
echo "   Restart: pm2 restart map-inventory-api"
echo "   Stop: pm2 stop map-inventory-api"
echo ""
