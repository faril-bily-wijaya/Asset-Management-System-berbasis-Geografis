const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users - Admin only
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, full_name, role, created_at, last_login 
             FROM users 
             ORDER BY created_at DESC`
        );

        res.json({ users: result.rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user role - Admin only
router.put('/:id/role', authenticateToken, requireRole(['admin']), [
    body('role').isIn(['admin', 'staff'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { role } = req.body;

        // Prevent self-demotion (can't change own role)
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        const result = await pool.query(
            `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, full_name, role`,
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'User role updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user - Admin only
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, username',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
