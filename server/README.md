# Map Inventory API

Backend API untuk Map Inventory Management System.

## 📁 Struktur Folder

```
server/
├── src/
│   ├── index.js           # Entry point
│   ├── config/
│   │   └── db.js          # PostgreSQL connection
│   ├── routes/
│   │   ├── auth.js        # Authentication (login, register)
│   │   ├── devices.js     # Device CRUD
│   │   ├── masters.js      # Brands, Models, Rooms
│   │   └── locations.js   # Location management
│   ├── middleware/
│   │   └── auth.js         # JWT authentication
│   └── utils/
├── scripts/
│   ├── setup-db.js        # Database setup script
│   └── setup-vps.sh       # VPS deployment script
├── uploads/               # Upload directory
├── .env.example           # Environment template
├── package.json
└── README.md
```

## 🚀 Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your database settings

# 3. Setup database
npm run setup-db

# 4. Start server
npm run dev
```

### VPS Deployment

```bash
# 1. Upload folder server ke VPS
scp -r ./server ubuntu@124.156.204.209:/home/ubuntu/map-inventory/

# 2. Login ke VPS
ssh ubuntu@124.156.204.209

# 3. Jalankan setup script
cd /home/ubuntu/map-inventory/server
chmod +x scripts/setup-vps.sh
sudo ./scripts/setup-vps.sh
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices` | Get all devices |
| GET | `/api/devices/:id` | Get single device |
| POST | `/api/devices` | Create device |
| PUT | `/api/devices/:id` | Update device |
| DELETE | `/api/devices/:id` | Delete device |
| POST | `/api/devices/upload-csv` | Import CSV |
| GET | `/api/devices/stats/summary` | Device statistics |

### Masters
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/masters/brands` | Get all brands |
| GET | `/api/masters/models` | Get all models |
| GET | `/api/masters/rooms` | Get all rooms |
| GET | `/api/masters/rooms/suggest` | Room suggestions |
| GET | `/api/masters/all` | Get all masters |

### Locations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | Get all locations |
| GET | `/api/locations/:id` | Get single location |
| POST | `/api/locations` | Create location |
| PUT | `/api/locations/:id` | Update location |
| DELETE | `/api/locations/:id` | Delete location |

## 🔐 Default Credentials

```
Username: admin
Password: admin123
```

⚠️ **Change password after first login!**

## 📊 Database Schema

### Tables
- `users` - User management
- `brands` - Brand master data
- `models` - Model master data
- `rooms` - Room master data
- `locations` - Location data with coordinates
- `devices` - Device inventory
- `device_history` - Audit trail

## 🛠️ Useful Commands

```bash
# View logs
pm2 logs map-inventory-api

# Restart server
pm2 restart map-inventory-api

# Stop server
pm2 stop map-inventory-api

# Monitor
pm2 monit
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| NODE_ENV | Environment | development |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_NAME | Database name | mapinventory |
| DB_USER | Database user | postgres |
| DB_PASS | Database password | postgres |
| JWT_SECRET | JWT secret key | - |
| FRONTEND_URL | Frontend URL | http://localhost:5173 |
