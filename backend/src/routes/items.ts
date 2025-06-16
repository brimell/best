import express from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all items for a user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            `SELECT i.*, c.name as category_name 
             FROM items i 
             LEFT JOIN categories c ON i.category_id = c.id 
             WHERE i.user_id = $1 
             ORDER BY i.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single item
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        
        const result = await pool.query(
            `SELECT i.*, c.name as category_name 
             FROM items i 
             LEFT JOIN categories c ON i.category_id = c.id 
             WHERE i.id = $1 AND i.user_id = $2`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new item
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            name,
            description,
            category_id,
            quantity,
            purchase_price,
            purchase_date,
            condition,
            location,
            image_url
        } = req.body;

        const result = await pool.query(
            `INSERT INTO items (
                user_id, category_id, name, description, quantity,
                purchase_price, purchase_date, condition, location, image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                userId, category_id, name, description, quantity,
                purchase_price, purchase_date, condition, location, image_url
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update an item
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const {
            name,
            description,
            category_id,
            quantity,
            purchase_price,
            purchase_date,
            condition,
            location,
            image_url
        } = req.body;

        // First check if item exists and belongs to user
        const checkResult = await pool.query(
            'SELECT * FROM items WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const result = await pool.query(
            `UPDATE items SET
                name = $1,
                description = $2,
                category_id = $3,
                quantity = $4,
                purchase_price = $5,
                purchase_date = $6,
                condition = $7,
                location = $8,
                image_url = $9,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $10 AND user_id = $11
            RETURNING *`,
            [
                name, description, category_id, quantity,
                purchase_price, purchase_date, condition,
                location, image_url, id, userId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete an item
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            'DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 