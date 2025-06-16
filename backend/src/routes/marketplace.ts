import express from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Type guard to ensure user is defined
const ensureUser = (req: express.Request): req is express.Request & { user: { userId: number } } => {
    return req.user !== undefined;
};

// Get all active marketplace listings
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ml.*, i.name as item_name, i.description as item_description,
                    i.image_url, i.condition, c.name as category_name,
                    u.username as seller_name
             FROM marketplace_listings ml
             JOIN items i ON ml.item_id = i.id
             JOIN categories c ON i.category_id = c.id
             JOIN users u ON ml.seller_id = u.id
             WHERE ml.status = 'active'
             ORDER BY ml.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching marketplace listings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single marketplace listing
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT ml.*, i.name as item_name, i.description as item_description,
                    i.image_url, i.condition, c.name as category_name,
                    u.username as seller_name
             FROM marketplace_listings ml
             JOIN items i ON ml.item_id = i.id
             JOIN categories c ON i.category_id = c.id
             JOIN users u ON ml.seller_id = u.id
             WHERE ml.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching marketplace listing:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new marketplace listing
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (!ensureUser(req)) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const userId = req.user.userId;
        const { item_id, price, description } = req.body;

        // Check if item exists and belongs to user
        const itemCheck = await pool.query(
            'SELECT * FROM items WHERE id = $1 AND user_id = $2',
            [item_id, userId]
        );

        if (itemCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check if item is already listed
        const existingListing = await pool.query(
            'SELECT * FROM marketplace_listings WHERE item_id = $1 AND status = $2',
            [item_id, 'active']
        );

        if (existingListing.rows.length > 0) {
            return res.status(400).json({ message: 'Item is already listed' });
        }

        const result = await pool.query(
            `INSERT INTO marketplace_listings (item_id, seller_id, price, description)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [item_id, userId, price, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating marketplace listing:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a marketplace listing
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (!ensureUser(req)) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const userId = req.user.userId;
        const { id } = req.params;
        const { price, description, status } = req.body;

        // Check if listing exists and belongs to user
        const listingCheck = await pool.query(
            'SELECT * FROM marketplace_listings WHERE id = $1 AND seller_id = $2',
            [id, userId]
        );

        if (listingCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const result = await pool.query(
            `UPDATE marketplace_listings
             SET price = $1, description = $2, status = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND seller_id = $5
             RETURNING *`,
            [price, description, status, id, userId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating marketplace listing:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a marketplace listing
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (!ensureUser(req)) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const userId = req.user.userId;
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM marketplace_listings WHERE id = $1 AND seller_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        console.error('Error deleting marketplace listing:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 