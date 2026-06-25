const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ==================== BRANDS ====================

// Get all brands
router.get('/brands', authenticateToken, async (req, res) => {
    try {
        const { search, limit = 100 } = req.query;
        let query = 'SELECT * FROM brands';
        let params = [];

        if (search) {
            query += ' WHERE name ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY name ASC LIMIT $' + (params.length + 1);
        params.push(limit);

        const result = await pool.query(query, params);
        res.json({ brands: result.rows });
    } catch (error) {
        console.error('Get brands error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create brand
router.post('/brands', authenticateToken, [
    body('name').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name } = req.body;
        const result = await pool.query(
            'INSERT INTO brands (name) VALUES ($1) RETURNING *',
            [name.trim()]
        );

        res.status(201).json({
            message: 'Brand created',
            brand: result.rows[0]
        });
    } catch (error) {
        console.error('Create brand error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== MODELS ====================

// Get all models
router.get('/models', authenticateToken, async (req, res) => {
    try {
        const { search, brand_id, limit = 100 } = req.query;
        let query = 'SELECT m.*, b.name as brand_name FROM models m LEFT JOIN brands b ON m.brand_id = b.id';
        let params = [];
        let conditions = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`m.name ILIKE $${params.length}`);
        }
        if (brand_id) {
            params.push(brand_id);
            conditions.push(`m.brand_id = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY m.name ASC LIMIT $' + (params.length + 1);
        params.push(limit);

        const result = await pool.query(query, params);
        res.json({ models: result.rows });
    } catch (error) {
        console.error('Get models error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create model
router.post('/models', authenticateToken, [
    body('name').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, brand_id } = req.body;
        const result = await pool.query(
            'INSERT INTO models (name, brand_id) VALUES ($1, $2) RETURNING *',
            [name.trim(), brand_id]
        );

        res.status(201).json({
            message: 'Model created',
            model: result.rows[0]
        });
    } catch (error) {
        console.error('Create model error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== ROOMS ====================

// Get all rooms
router.get('/rooms', authenticateToken, async (req, res) => {
    try {
        const { search, limit = 100 } = req.query;
        let query = 'SELECT * FROM rooms';
        let params = [];

        if (search) {
            query += ' WHERE name ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY name ASC LIMIT $' + (params.length + 1);
        params.push(limit);

        const result = await pool.query(query, params);
        res.json({ rooms: result.rows });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get room suggestions (fuzzy)
router.get('/rooms/suggest', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 1) {
            return res.json({ suggestions: [] });
        }

        const result = await pool.query(
            `SELECT DISTINCT name FROM rooms 
             WHERE name ILIKE $1 
             ORDER BY name ASC 
             LIMIT 10`,
            [`%${q}%`]
        );

        res.json({
            suggestions: result.rows.map(r => r.name)
        });
    } catch (error) {
        console.error('Room suggestions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create room
router.post('/rooms', authenticateToken, [
    body('name').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name } = req.body;
        const result = await pool.query(
            'INSERT INTO rooms (name) VALUES ($1) RETURNING *',
            [name.trim()]
        );

        res.status(201).json({
            message: 'Room created',
            room: result.rows[0]
        });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== DEVICE TYPES ====================

// Get all device types
router.get('/device-types', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT device_type as name FROM devices ORDER BY device_type`
        );
        res.json({ deviceTypes: result.rows });
    } catch (error) {
        console.error('Get device types error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all statuses
router.get('/statuses', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT status as name FROM devices ORDER BY status`
        );
        res.json({ statuses: result.rows });
    } catch (error) {
        console.error('Get statuses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== ALL MASTERS ====================

// Get all masters in one call
router.get('/all', authenticateToken, async (req, res) => {
    try {
        const [brands, models, rooms, deviceTypes, statuses] = await Promise.all([
            pool.query('SELECT * FROM brands ORDER BY name'),
            pool.query('SELECT m.*, b.name as brand_name FROM models m LEFT JOIN brands b ON m.brand_id = b.id ORDER BY m.name'),
            pool.query('SELECT * FROM rooms ORDER BY name'),
            pool.query('SELECT DISTINCT device_type as name FROM devices ORDER BY device_type'),
            pool.query('SELECT DISTINCT status as name FROM devices ORDER BY status')
        ]);

        res.json({
            brands: brands.rows,
            models: models.rows,
            rooms: rooms.rows,
            deviceTypes: deviceTypes.rows,
            statuses: statuses.rows
        });
    } catch (error) {
        console.error('Get all masters error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
