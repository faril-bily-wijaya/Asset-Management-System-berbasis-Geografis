const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all custom hierarchy items
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM custom_hierarchy ORDER BY type, name`
        );

        // Group by type for easier frontend consumption
        const grouped = {
            regionals: [],
            districts: [],
            clusters: [],
            stos: []
        };

        for (const item of result.rows) {
            const entry = {
                id: item.id,
                name: item.name,
                parent_regional: item.parent_regional,
                parent_district: item.parent_district,
                parent_cluster: item.parent_cluster,
                created_at: item.created_at
            };

            switch (item.type) {
                case 'regional':
                    grouped.regionals.push(entry);
                    break;
                case 'district':
                    grouped.districts.push(entry);
                    break;
                case 'cluster':
                    grouped.clusters.push(entry);
                    break;
                case 'sto':
                    grouped.stos.push(entry);
                    break;
            }
        }

        // Also add hierarchy mappings for easier access
        const hierarchy = {};

        for (const reg of grouped.regionals) {
            if (!hierarchy[reg.name]) hierarchy[reg.name] = {};
        }

        for (const dist of grouped.districts) {
            const reg = dist.parent_regional || 'UNKNOWN_REGIONAL';
            if (!hierarchy[reg]) hierarchy[reg] = {};
            if (!hierarchy[reg][dist.name]) hierarchy[reg][dist.name] = {};
        }

        for (const clust of grouped.clusters) {
            const reg = clust.parent_regional || 'UNKNOWN_REGIONAL';
            const dist = clust.parent_district || 'UNKNOWN_DISTRICT';
            if (!hierarchy[reg]) hierarchy[reg] = {};
            if (!hierarchy[reg][dist]) hierarchy[reg][dist] = {};
            if (!hierarchy[reg][dist][clust.name]) hierarchy[reg][dist][clust.name] = [];
        }

        for (const sto of grouped.stos) {
            const reg = sto.parent_regional || 'UNKNOWN_REGIONAL';
            const dist = sto.parent_district || 'UNKNOWN_DISTRICT';
            const clust = sto.parent_cluster || 'UNKNOWN_CLUSTER';
            if (!hierarchy[reg]) hierarchy[reg] = {};
            if (!hierarchy[reg][dist]) hierarchy[reg][dist] = {};
            if (!hierarchy[reg][dist][clust]) hierarchy[reg][dist][clust] = [];
            if (!hierarchy[reg][dist][clust].includes(sto.name)) {
                hierarchy[reg][dist][clust].push(sto.name);
            }
        }

        res.json({
            ...grouped,
            hierarchy
        });
    } catch (error) {
        console.error('Get hierarchy error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create custom hierarchy item - Admin only
router.post('/', authenticateToken, requireRole(['admin']), [
    body('type').isIn(['regional', 'district', 'cluster', 'sto']),
    body('name').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { type, name, parent_regional, parent_district, parent_cluster } = req.body;
        const normalizedName = name.trim().toUpperCase();

        // Check for duplicates
        const existing = await pool.query(
            'SELECT id FROM custom_hierarchy WHERE type = $1 AND name = $2',
            [type, normalizedName]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'Item already exists' });
        }

        const result = await pool.query(
            `INSERT INTO custom_hierarchy (type, name, parent_regional, parent_district, parent_cluster, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [type, normalizedName, parent_regional || null, parent_district || null, parent_cluster || null, req.user.id]
        );

        res.status(201).json({
            message: 'Hierarchy item created',
            item: result.rows[0]
        });
    } catch (error) {
        console.error('Create hierarchy error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update custom hierarchy item - Admin only
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parent_regional, parent_district, parent_cluster } = req.body;

        // Get current item
        const current = await pool.query(
            'SELECT * FROM custom_hierarchy WHERE id = $1',
            [id]
        );

        if (current.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const normalizedName = name ? name.trim().toUpperCase() : current.rows[0].name;

        // Check for name conflict if name is being changed
        if (name && normalizedName !== current.rows[0].name) {
            const existing = await pool.query(
                'SELECT id FROM custom_hierarchy WHERE type = $1 AND name = $2 AND id != $3',
                [current.rows[0].type, normalizedName, id]
            );
            if (existing.rows.length > 0) {
                return res.status(409).json({ message: 'Item name already exists' });
            }
        }

        const result = await pool.query(
            `UPDATE custom_hierarchy SET 
                name = $1,
                parent_regional = COALESCE($2, parent_regional),
                parent_district = COALESCE($3, parent_district),
                parent_cluster = COALESCE($4, parent_cluster),
                updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [normalizedName, parent_regional, parent_district, parent_cluster, id]
        );

        res.json({
            message: 'Hierarchy item updated',
            item: result.rows[0]
        });
    } catch (error) {
        console.error('Update hierarchy error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete custom hierarchy item - Admin only
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Get item first
        const item = await pool.query(
            'SELECT * FROM custom_hierarchy WHERE id = $1',
            [id]
        );

        if (item.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // For districts, delete all clusters and stos under it
        if (item.rows[0].type === 'district') {
            await pool.query(
                `DELETE FROM custom_hierarchy 
                 WHERE type IN ('cluster', 'sto') 
                 AND parent_district = $1`,
                [item.rows[0].name]
            );
        }

        // For clusters, delete all stos under it
        if (item.rows[0].type === 'cluster') {
            await pool.query(
                `DELETE FROM custom_hierarchy 
                 WHERE type = 'sto' AND parent_cluster = $1`,
                [item.rows[0].name]
            );
        }

        // Delete the item
        await pool.query('DELETE FROM custom_hierarchy WHERE id = $1', [id]);

        res.json({ message: 'Hierarchy item deleted' });
    } catch (error) {
        console.error('Delete hierarchy error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Bulk delete hierarchy items - Admin only
router.post('/bulk-delete', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Invalid IDs array' });
        }

        // First get all items to be deleted
        const items = await pool.query(
            'SELECT * FROM custom_hierarchy WHERE id = ANY($1)',
            [ids]
        );

        // Collect all names and types to cascade delete
        const toDelete = {
            districts: [],
            clusters: [],
            stos: []
        };

        for (const item of items.rows) {
            if (item.type === 'regional') {
                // Delete all districts, clusters, stos under this regional
                const children = await pool.query(
                    `SELECT name, type FROM custom_hierarchy WHERE parent_regional = $1`,
                    [item.name]
                );
                for (const child of children.rows) {
                    if (child.type === 'district') toDelete.districts.push(child.name);
                    if (child.type === 'cluster') toDelete.clusters.push(child.name);
                    if (child.type === 'sto') toDelete.stos.push(child.name);
                }
            } else if (item.type === 'district') {
                toDelete.districts.push(item.name);
                const children = await pool.query(
                    `SELECT name, type FROM custom_hierarchy WHERE parent_district = $1`,
                    [item.name]
                );
                for (const child of children.rows) {
                    if (child.type === 'cluster') toDelete.clusters.push(child.name);
                    if (child.type === 'sto') toDelete.stos.push(child.name);
                }
            } else if (item.type === 'cluster') {
                toDelete.clusters.push(item.name);
                const children = await pool.query(
                    `SELECT name FROM custom_hierarchy WHERE parent_cluster = $1`,
                    [item.name]
                );
                toDelete.stos.push(...children.rows.map(c => c.name));
            } else {
                toDelete.stos.push(item.name);
            }
        }

        // Cascade delete
        if (toDelete.stos.length > 0) {
            await pool.query(
                `DELETE FROM custom_hierarchy WHERE type = 'sto' AND name = ANY($1)`,
                [toDelete.stos]
            );
        }
        if (toDelete.clusters.length > 0) {
            await pool.query(
                `DELETE FROM custom_hierarchy WHERE type = 'cluster' AND name = ANY($1)`,
                [toDelete.clusters]
            );
        }
        if (toDelete.districts.length > 0) {
            await pool.query(
                `DELETE FROM custom_hierarchy WHERE type = 'district' AND name = ANY($1)`,
                [toDelete.districts]
            );
        }

        // Finally delete the requested items
        const result = await pool.query(
            'DELETE FROM custom_hierarchy WHERE id = ANY($1) RETURNING id',
            [ids]
        );

        res.json({
            message: `${result.rows.length} items deleted`,
            deleted: result.rows.length
        });
    } catch (error) {
        console.error('Bulk delete hierarchy error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
