const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all locations
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search, region, limit = 500 } = req.query;
        let query = `SELECT l.*, 
                            COUNT(d.id) as device_count,
                            COALESCE(SUM(CASE WHEN d.status = 'operational' THEN 1 ELSE 0 END), 0) as operational_count,
                            COALESCE(SUM(CASE WHEN d.status = 'fault' THEN 1 ELSE 0 END), 0) as fault_count
                     FROM locations l
                     LEFT JOIN devices d ON l.id = d.location_id`;
        let params = [];
        let conditions = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(l.name ILIKE $${params.length} OR l.address ILIKE $${params.length})`);
        }
        if (region) {
            params.push(region);
            conditions.push(`l.region = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` GROUP BY l.id ORDER BY l.name ASC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await pool.query(query, params);
        res.json({ locations: result.rows });
    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all locations optimized for map view
router.get('/map-data', async (req, res) => {
    try {
        // Fetch all locations
        const locationsResult = await pool.query(
            `SELECT * FROM locations ORDER BY name ASC`
        );

        // Fetch all devices with required fields for filtering
        const devicesResult = await pool.query(
            `SELECT d.*, 
                    b.name as brand_name,
                    r.name as room_name
             FROM devices d
             LEFT JOIN brands b ON d.brand_id = b.id
             LEFT JOIN rooms r ON d.room_id = r.id`
        );

        // Group devices by location_id
        const devicesByLocation = {};
        for (const device of devicesResult.rows) {
            if (!devicesByLocation[device.location_id]) {
                devicesByLocation[device.location_id] = [];
            }
            // Map the database fields back to the format the frontend expects
            devicesByLocation[device.location_id].push({
                ...device,
                DEVICE_CODE: device.name,
                DEVICE_TYPE: device.device_type,
                BRAND: device.brand_name,
                ROOM: device.room_name,
                STATUS: device.status === 'operational' ? 'OPERATIONAL' : 'FAULT',
                CONDITION: device.notes,
                CAP_REAL: device.capacity,
                CAP_STATUS: device.capacity,
                LOCATION: '', // The frontend will get this from the parent
                YEAR: device.year_operations,
                CODE: device.serial_number
            });
        }

        // Map locations to the frontend format
        const mapData = locationsResult.rows.map(loc => ({
            id: loc.id,
            name: loc.name,
            coords: [parseFloat(loc.latitude), parseFloat(loc.longitude)],
            cluster: loc.cluster || 'CLUSTER BENGKULU',
            class_type: loc.class_type || 'BASIC',
            devices: devicesByLocation[loc.id] || []
        }));

        res.json(mapData);
    } catch (error) {
        console.error('Get map data error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single location
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const locationResult = await pool.query(
            `SELECT l.*, 
                    COUNT(d.id) as device_count,
                    COALESCE(SUM(CASE WHEN d.status = 'operational' THEN 1 ELSE 0 END), 0) as operational_count,
                    COALESCE(SUM(CASE WHEN d.status = 'fault' THEN 1 ELSE 0 END), 0) as fault_count
             FROM locations l
             LEFT JOIN devices d ON l.id = d.location_id
             WHERE l.id = $1
             GROUP BY l.id`,
            [id]
        );

        if (locationResult.rows.length === 0) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // Get devices at this location
        const devicesResult = await pool.query(
            `SELECT d.*, b.name as brand_name, m.name as model_name
             FROM devices d
             LEFT JOIN brands b ON d.brand_id = b.id
             LEFT JOIN models m ON d.model_id = m.id
             WHERE d.location_id = $1
             ORDER BY d.name`,
            [id]
        );

        res.json({
            location: locationResult.rows[0],
            devices: devicesResult.rows
        });
    } catch (error) {
        console.error('Get location error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create location
router.post('/', authenticateToken, [
    body('name').notEmpty().trim(),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, address, latitude, longitude, region, city, postal_code, cluster, class_type, notes } = req.body;

        const result = await pool.query(
            `INSERT INTO locations (name, address, latitude, longitude, region, city, postal_code, cluster, class_type, notes, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [name.trim(), address, latitude, longitude, region, city, postal_code, cluster, class_type, notes, req.user.id]
        );

        res.status(201).json({
            message: 'Location created',
            location: result.rows[0]
        });
    } catch (error) {
        console.error('Create location error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update location
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, latitude, longitude, region, city, postal_code, cluster, class_type, notes } = req.body;

        const result = await pool.query(
            `UPDATE locations SET 
                name = COALESCE($1, name),
                address = COALESCE($2, address),
                latitude = COALESCE($3, latitude),
                longitude = COALESCE($4, longitude),
                region = COALESCE($5, region),
                city = COALESCE($6, city),
                postal_code = COALESCE($7, postal_code),
                cluster = COALESCE($8, cluster),
                class_type = COALESCE($9, class_type),
                notes = COALESCE($10, notes),
                updated_at = NOW()
             WHERE id = $11
             RETURNING *`,
            [name, address, latitude, longitude, region, city, postal_code, cluster, class_type, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Location not found' });
        }

        res.json({
            message: 'Location updated',
            location: result.rows[0]
        });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete location
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if location has devices
        const deviceCheck = await pool.query(
            'SELECT COUNT(*) FROM devices WHERE location_id = $1',
            [id]
        );

        if (parseInt(deviceCheck.rows[0].count) > 0) {
            return res.status(400).json({
                message: 'Cannot delete location with devices. Remove or reassign devices first.'
            });
        }

        const result = await pool.query(
            'DELETE FROM locations WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Location not found' });
        }

        res.json({ message: 'Location deleted' });
    } catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get regions
router.get('/stats/regions', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT region, COUNT(*) as location_count, 
                    COUNT(d.id) as device_count
             FROM locations l
             LEFT JOIN devices d ON l.id = d.location_id
             WHERE region IS NOT NULL
             GROUP BY region
             ORDER BY location_count DESC`
        );

        res.json({ regions: result.rows });
    } catch (error) {
        console.error('Get regions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
