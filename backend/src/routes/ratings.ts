import express from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Type guard to ensure user is defined
const ensureUser = (req: express.Request): req is express.Request & { user: { userId: number } } => {
    return req.user !== undefined;
};

// Get ratings for an item
router.get('/item/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const result = await pool.query(
            `SELECT r.*, u.username, ppc.name as price_point_category
             FROM item_ratings r
             JOIN users u ON r.user_id = u.id
             LEFT JOIN price_point_categories ppc ON r.price_point_category_id = ppc.id
             WHERE r.item_id = $1
             ORDER BY r.created_at DESC`,
            [itemId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's ratings
router.get('/user', authenticateToken, async (req, res) => {
    try {
        if (!ensureUser(req)) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT r.*, i.name as item_name, i.image_url,
                    ppc.name as price_point_category
             FROM item_ratings r
             JOIN items i ON r.item_id = i.id
             LEFT JOIN price_point_categories ppc ON r.price_point_category_id = ppc.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching user ratings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add or update a rating
router.post('/:itemId', authenticateToken, async (req, res) => {
    try {
        if (!ensureUser(req)) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const userId = req.user.userId;
        const { itemId } = req.params;
        const { rating, review, price_point_category_id } = req.body;

        // Validate rating
        if (rating < 0 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 0 and 5' });
        }

        // Check if item exists
        const itemCheck = await pool.query(
            'SELECT * FROM items WHERE id = $1',
            [itemId]
        );

        if (itemCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check if user has already rated this item
        const existingRating = await pool.query(
            'SELECT * FROM item_ratings WHERE user_id = $1 AND item_id = $2',
            [userId, itemId]
        );

        let result;
        if (existingRating.rows.length > 0) {
            // Update existing rating
            result = await pool.query(
                `UPDATE item_ratings
                 SET rating = $1, review = $2, price_point_category_id = $3,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $4 AND item_id = $5
                 RETURNING *`,
                [rating, review, price_point_category_id, userId, itemId]
            );
        } else {
            // Create new rating
            result = await pool.query(
                `INSERT INTO item_ratings
                 (user_id, item_id, rating, review, price_point_category_id)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [userId, itemId, rating, review, price_point_category_id]
            );
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating/updating rating:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a rating
router.delete('/:itemId', authenticateToken, async (req, res) => {
    try {
        if (!ensureUser(req)) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const userId = req.user.userId;
        const { itemId } = req.params;

        const result = await pool.query(
            'DELETE FROM item_ratings WHERE user_id = $1 AND item_id = $2 RETURNING *',
            [userId, itemId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        res.json({ message: 'Rating deleted successfully' });
    } catch (error) {
        console.error('Error deleting rating:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get top rated items by price point
router.get('/top-rated/:pricePointId', async (req, res) => {
    try {
        const { pricePointId } = req.params;
        const result = await pool.query(
            `SELECT * FROM top_rated_items_by_price
             WHERE price_point_category_id = $1
             ORDER BY average_rating DESC, total_ratings DESC
             LIMIT 10`,
            [pricePointId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching top rated items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all price point categories
router.get('/price-points', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM price_point_categories ORDER BY min_price'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching price point categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 