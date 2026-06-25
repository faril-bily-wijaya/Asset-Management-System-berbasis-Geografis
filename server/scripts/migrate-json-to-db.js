const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/config/db');

async function migrate() {
    console.log('🚀 Starting migration of data-grouped.json to PostgreSQL...');

    try {
        // 1. Alter table locations to ensure cluster and class_type exist
        console.log('🔄 Updating locations table schema...');
        await pool.query(`
            ALTER TABLE locations 
            ADD COLUMN IF NOT EXISTS cluster VARCHAR(100),
            ADD COLUMN IF NOT EXISTS class_type VARCHAR(50);
        `);
        console.log('✅ Locations table schema updated.');

        // 2. Read the JSON file (path handles both local and VPS structure)
        const vpsPath = path.join(__dirname, '../../DATA_SECRET/data-grouped.json');
        const localPath = path.join(__dirname, '../../public/DATA_SECRET/data-grouped.json');
        
        const dataPath = fs.existsSync(vpsPath) ? vpsPath : localPath;

        if (!fs.existsSync(dataPath)) {
            throw new Error(`Data file not found. Tried: \n- ${vpsPath}\n- ${localPath}`);
        }
        
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const locations = JSON.parse(rawData);
        console.log(`📦 Loaded ${locations.length} locations from JSON.`);

        // 3. Process each location
        for (const loc of locations) {
            console.log(`Processing location: ${loc.name}...`);
            
            // Insert or update location
            const locResult = await pool.query(
                `INSERT INTO locations (name, latitude, longitude, cluster, class_type)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT DO NOTHING
                 RETURNING id`,
                [
                    loc.name, 
                    loc.coords ? loc.coords[0] : null, 
                    loc.coords ? loc.coords[1] : null, 
                    loc.cluster, 
                    loc.class_type
                ]
            );

            // If it existed before, get its ID
            let locationId;
            if (locResult.rows && locResult.rows.length > 0) {
                locationId = locResult.rows[0].id;
            } else {
                const existing = await pool.query('SELECT id FROM locations WHERE name = $1', [loc.name]);
                if (existing.rows.length > 0) locationId = existing.rows[0].id;
            }

            if (!locationId) {
                console.error(`Failed to get/create location ID for ${loc.name}`);
                continue;
            }

            // Process devices
            if (loc.devices && loc.devices.length > 0) {
                for (const d of loc.devices) {
                    // Find or create brand
                    let brandId = null;
                    if (d.BRAND) {
                        const brandResult = await pool.query(
                            'INSERT INTO brands (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                            [d.BRAND.trim()]
                        );
                        brandId = brandResult.rows[0].id;
                    }

                    // Find or create room
                    let roomId = null;
                    if (d.ROOM) {
                        const roomResult = await pool.query(
                            'INSERT INTO rooms (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                            [d.ROOM.trim()]
                        );
                        roomId = roomResult.rows[0].id;
                    }

                    // Insert device
                    // Map STATUS to lowercase operational or fault
                    const mappedStatus = d.STATUS === 'OPERATIONAL' ? 'operational' : 'fault';

                    await pool.query(
                        `INSERT INTO devices (name, device_type, serial_number, brand_id, 
                                              room_id, location_id, status, capacity, 
                                              year_operations, notes)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                         ON CONFLICT DO NOTHING`,
                        [
                            d.DEVICE_CODE || d.CODE || 'Unnamed Device',
                            d.DEVICE_TYPE || 'UNKNOWN',
                            d.CODE,
                            brandId,
                            roomId,
                            locationId,
                            mappedStatus,
                            d.CAP_REAL || d.CAP_STATUS,
                            parseInt(d.YEAR) || null,
                            d.CONDITION
                        ]
                    );
                }
                console.log(`   ✅ Inserted ${loc.devices.length} devices.`);
            }
        }

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
