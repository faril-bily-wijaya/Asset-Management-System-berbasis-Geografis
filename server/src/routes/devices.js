const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { body, query, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for CSV upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `devices-${Date.now()}.csv`);
    }
});
const upload = multer({ storage });

// Get all devices with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 100,
            brand,
            model,
            room,
            status,
            device_type,
            location_id,
            search
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let params = [];
        let paramCount = 0;

        if (brand) {
            paramCount++;
            whereConditions.push(`d.brand_id = $${paramCount}`);
            params.push(brand);
        }
        if (model) {
            paramCount++;
            whereConditions.push(`d.model_id = $${paramCount}`);
            params.push(model);
        }
        if (room) {
            paramCount++;
            whereConditions.push(`d.room_id = $${paramCount}`);
            params.push(room);
        }
        if (status) {
            paramCount++;
            whereConditions.push(`d.status = $${paramCount}`);
            params.push(status);
        }
        if (device_type) {
            paramCount++;
            whereConditions.push(`d.device_type = $${paramCount}`);
            params.push(device_type);
        }
        if (location_id) {
            paramCount++;
            whereConditions.push(`d.location_id = $${paramCount}`);
            params.push(location_id);
        }
        if (search) {
            paramCount++;
            whereConditions.push(`(d.name ILIKE $${paramCount} OR d.serial_number ILIKE $${paramCount})`);
            params.push(`%${search}%`);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get total count
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM devices d ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get devices
        paramCount++;
        const limitParam = paramCount;
        params.push(limit);
        paramCount++;
        const offsetParam = paramCount;
        params.push(offset);

        const result = await pool.query(
            `SELECT d.*, 
                    b.name as brand_name,
                    m.name as model_name,
                    r.name as room_name,
                    l.name as location_name,
                    l.latitude,
                    l.longitude
             FROM devices d
             LEFT JOIN brands b ON d.brand_id = b.id
             LEFT JOIN models m ON d.model_id = m.id
             LEFT JOIN rooms r ON d.room_id = r.id
             LEFT JOIN locations l ON d.location_id = l.id
             ${whereClause}
             ORDER BY d.created_at DESC
             LIMIT $${limitParam} OFFSET $${offsetParam}`,
            params
        );

        res.json({
            devices: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single device
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT d.*, 
                    b.name as brand_name,
                    m.name as model_name,
                    r.name as room_name,
                    l.name as location_name,
                    l.latitude,
                    l.longitude
             FROM devices d
             LEFT JOIN brands b ON d.brand_id = b.id
             LEFT JOIN models m ON d.model_id = m.id
             LEFT JOIN rooms r ON d.room_id = r.id
             LEFT JOIN locations l ON d.location_id = l.id
             WHERE d.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Device not found' });
        }

        res.json({ device: result.rows[0] });
    } catch (error) {
        console.error('Get device error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create device
router.post('/', authenticateToken, [
    body('name').notEmpty().trim(),
    body('device_type').notEmpty(),
    body('location_id').isInt()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name, device_type, serial_number, brand_id, model_id,
            room_id, location_id, status, capacity, year_operations,
            notes, latitude, longitude
        } = req.body;

        const result = await pool.query(
            `INSERT INTO devices (name, device_type, serial_number, brand_id, model_id, 
                                  room_id, location_id, status, capacity, year_operations, 
                                  notes, latitude, longitude, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [name, device_type, serial_number, brand_id, model_id,
                room_id, location_id, status || 'operational', capacity,
                year_operations, notes, latitude, longitude, req.user.id]
        );

        res.status(201).json({
            message: 'Device created successfully',
            device: result.rows[0]
        });
    } catch (error) {
        console.error('Create device error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update device
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, device_type, serial_number, brand_id, model_id,
            room_id, location_id, status, capacity, year_operations,
            notes, latitude, longitude
        } = req.body;

        const result = await pool.query(
            `UPDATE devices SET 
                name = COALESCE($1, name),
                device_type = COALESCE($2, device_type),
                serial_number = COALESCE($3, serial_number),
                brand_id = COALESCE($4, brand_id),
                model_id = COALESCE($5, model_id),
                room_id = COALESCE($6, room_id),
                location_id = COALESCE($7, location_id),
                status = COALESCE($8, status),
                capacity = COALESCE($9, capacity),
                year_operations = COALESCE($10, year_operations),
                notes = COALESCE($11, notes),
                latitude = COALESCE($12, latitude),
                longitude = COALESCE($13, longitude),
                updated_at = NOW()
             WHERE id = $14
             RETURNING *`,
            [name, device_type, serial_number, brand_id, model_id,
                room_id, location_id, status, capacity, year_operations,
                notes, latitude, longitude, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Device not found' });
        }

        res.json({
            message: 'Device updated successfully',
            device: result.rows[0]
        });
    } catch (error) {
        console.error('Update device error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete device
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM devices WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Device not found' });
        }

        res.json({ message: 'Device deleted successfully' });
    } catch (error) {
        console.error('Delete device error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Bulk delete devices
router.post('/bulk-delete', authenticateToken, async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Invalid IDs array' });
        }

        const result = await pool.query(
            'DELETE FROM devices WHERE id = ANY($1) RETURNING id',
            [ids]
        );

        res.json({
            message: `${result.rows.length} devices deleted`,
            deleted: result.rows.length
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload CSV
router.post('/upload-csv', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const devices = [];
        const fs = require('fs');

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (row) => {
                devices.push(row);
            })
            .on('end', async () => {
                try {
                    let imported = 0;
                    let errors = [];

                    for (const row of devices) {
                        try {
                            // Find or create brand
                            let brandId = null;
                            if (row.MERK) {
                                const brandResult = await pool.query(
                                    'INSERT INTO brands (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                                    [row.MERK.trim()]
                                );
                                brandId = brandResult.rows[0].id;
                            }

                            // Find or create model
                            let modelId = null;
                            if (row.MODEL) {
                                const modelResult = await pool.query(
                                    'INSERT INTO models (name, brand_id) VALUES ($1, $2) ON CONFLICT (name, brand_id) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                                    [row.MODEL.trim(), brandId]
                                );
                                modelId = modelResult.rows[0].id;
                            }

                            // Find or create room
                            let roomId = null;
                            if (row.ROOM) {
                                const roomResult = await pool.query(
                                    'INSERT INTO rooms (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                                    [row.ROOM.trim()]
                                );
                                roomId = roomResult.rows[0].id;
                            }

                            // Find location
                            let locationId = null;
                            if (row.LOKASI) {
                                const locResult = await pool.query(
                                    'SELECT id FROM locations WHERE name ILIKE $1 LIMIT 1',
                                    [`%${row.LOKASI}%`]
                                );
                                if (locResult.rows.length > 0) {
                                    locationId = locResult.rows[0].id;
                                }
                            }

                            // Insert device
                            await pool.query(
                                `INSERT INTO devices (name, device_type, serial_number, brand_id, model_id, 
                                                      room_id, location_id, status, capacity, year_operations, notes)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                                [
                                    row.NAMA_PERANGKAT || row.NAME || 'Unnamed Device',
                                    row.JENIS || row.TYPE || 'UNKNOWN',
                                    row.SERIAL || row.NO_SERI,
                                    brandId,
                                    modelId,
                                    roomId,
                                    locationId,
                                    row.STATUS || 'operational',
                                    row.KAPASITAS || row.CAPACITY,
                                    row.YEAR || row.TAHUN,
                                    row.NOTES || row.CATATAN
                                ]
                            );
                            imported++;
                        } catch (rowError) {
                            errors.push({ row: devices.indexOf(row) + 1, error: rowError.message });
                        }
                    }

                    // Clean up uploaded file
                    fs.unlinkSync(req.file.path);

                    res.json({
                        message: 'CSV imported',
                        imported,
                        errors: errors.length > 0 ? errors : undefined
                    });
                } catch (error) {
                    console.error('CSV processing error:', error);
                    res.status(500).json({ message: 'Error processing CSV' });
                }
            });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
    try {
        const deviceTypeStats = await pool.query(
            `SELECT device_type, COUNT(*) as count 
             FROM devices 
             GROUP BY device_type 
             ORDER BY count DESC`
        );

        const statusStats = await pool.query(
            `SELECT status, COUNT(*) as count 
             FROM devices 
             GROUP BY status 
             ORDER BY count DESC`
        );

        const totalDevices = await pool.query('SELECT COUNT(*) FROM devices');

        res.json({
            total: parseInt(totalDevices.rows[0].count),
            byType: deviceTypeStats.rows,
            byStatus: statusStats.rows
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
