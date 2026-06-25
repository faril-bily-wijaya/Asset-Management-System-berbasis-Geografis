/**
 * Database Setup Script
 * Run this script to initialize the PostgreSQL database schema
 * 
 * Usage: npm run setup-db
 */

require('dotenv').config();
const { Pool } = require('pg');

// Connection to postgres database (default) to create our database
const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
});

const appPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mapinventory',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
});

const DATABASE_NAME = process.env.DB_NAME || 'mapinventory';

const createTablesSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Brands table (master data)
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Models table (master data)
CREATE TABLE IF NOT EXISTS models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, brand_id)
);

-- Rooms table (master data)
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    region VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(10),
    cluster VARCHAR(100),
    class_type VARCHAR(50),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    serial_number VARCHAR(100),
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    model_id INTEGER REFERENCES models(id) ON DELETE SET NULL,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'operational',
    capacity VARCHAR(50),
    year_operations INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device history table (for audit trail)
CREATE TABLE IF NOT EXISTS device_history (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_location ON devices(location_id);
CREATE INDEX IF NOT EXISTS idx_devices_brand ON devices(brand_id);
CREATE INDEX IF NOT EXISTS idx_devices_model ON devices(model_id);
CREATE INDEX IF NOT EXISTS idx_devices_room ON devices(room_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type);
CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region);
`;

async function setupDatabase() {
    console.log('🚀 Starting database setup...\n');

    try {
        // Check if database exists
        console.log(`📦 Checking if database '${DATABASE_NAME}' exists...`);
        const dbCheck = await adminPool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [DATABASE_NAME]
        );

        if (dbCheck.rows.length === 0) {
            console.log(`   Creating database '${DATABASE_NAME}'...`);
            await adminPool.query(`CREATE DATABASE ${DATABASE_NAME}`);
            console.log(`   ✅ Database created!\n`);
        } else {
            console.log(`   ✅ Database already exists.\n`);
        }

        // Close admin pool
        await adminPool.end();

        // Create tables
        console.log('📋 Creating tables...');
        await appPool.query(createTablesSQL);
        console.log('   ✅ Tables created!\n');

        // Insert default admin user if not exists
        console.log('👤 Creating default admin user...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await appPool.query(`
            INSERT INTO users (username, email, password, full_name, role)
            VALUES ('admin', 'admin@mapinventory.local', $1, 'Administrator', 'admin')
            ON CONFLICT (username) DO NOTHING
        `, [hashedPassword]);
        console.log('   ✅ Default admin user created!');
        console.log('   📝 Username: admin');
        console.log('   📝 Password: admin123\n');

        // Insert sample brands
        console.log('🏷️  Inserting sample brands...');
        const sampleBrands = [
            'DAIKIN', 'PANASONIC', 'LG', 'SAMSUNG', 'MITSUBISHI',
            'SHARP', 'HITACHI', 'TOSHIBA', 'FUJITSU', 'CARRIER',
            'ABB', 'EMERSON', 'SCHNEIDER', 'EATON', 'DELTA'
        ];

        for (const brand of sampleBrands) {
            await appPool.query(
                'INSERT INTO brands (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                [brand]
            );
        }
        console.log(`   ✅ ${sampleBrands.length} brands inserted!\n`);

        // Insert sample rooms
        console.log('🏠 Inserting sample rooms...');
        const sampleRooms = [
            'R. SERVER', 'R. AC', 'R. GENSET', 'R. BATERAI',
            'R. TRAFO', 'R. PANEL', 'R. MONITORING', 'R. PERALATAN'
        ];

        for (const room of sampleRooms) {
            await appPool.query(
                'INSERT INTO rooms (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                [room]
            );
        }
        console.log(`   ✅ ${sampleRooms.length} rooms inserted!\n`);

        console.log('🎉 Database setup completed successfully!\n');
        console.log('📌 Next steps:');
        console.log('   1. Run "npm run dev" to start the server');
        console.log('   2. Update .env with your production settings');
        console.log('   3. Change the default admin password!\n');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    } finally {
        await appPool.end();
    }
}

setupDatabase();
