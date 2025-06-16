import express from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Get total items and listed items
        const itemsResult = await pool.query(
            `SELECT 
                COUNT(*) as total_items,
                COUNT(DISTINCT CASE WHEN ml.id IS NOT NULL THEN i.id END) as listed_items
             FROM items i
             LEFT JOIN marketplace_listings ml ON i.id = ml.item_id AND ml.status = 'active'
             WHERE i.user_id = $1`,
            [userId]
        );

        // Get total value of inventory
        const valueResult = await pool.query(
            'SELECT COALESCE(SUM(purchase_price * quantity), 0) as total_value FROM items WHERE user_id = $1',
            [userId]
        );

        // Get active listings count
        const listingsResult = await pool.query(
            `SELECT COUNT(*) as active_listings 
             FROM marketplace_listings ml
             JOIN items i ON ml.item_id = i.id
             WHERE i.user_id = $1 AND ml.status = 'active'`,
            [userId]
        );

        // Get total views (we'll use marketplace listing views if we add them later)
        const viewsResult = await pool.query(
            'SELECT 0 as total_views'  // Placeholder until we implement view tracking
        );

        // Get ratings statistics
        const ratingsResult = await pool.query(
            `SELECT 
                COUNT(*) as total_ratings,
                COALESCE(AVG(rating), 0) as average_rating
             FROM item_ratings r
             JOIN items i ON r.item_id = i.id
             WHERE i.user_id = $1`,
            [userId]
        );

        // Get recent activity
        const activityResult = await pool.query(
            `(SELECT 
                'rating' as type,
                'New rating received' as description,
                r.created_at as timestamp,
                r.id
             FROM item_ratings r
             JOIN items i ON r.item_id = i.id
             WHERE i.user_id = $1)
             UNION ALL
             (SELECT 
                'listing' as type,
                'New marketplace listing' as description,
                ml.created_at as timestamp,
                ml.id
             FROM marketplace_listings ml
             JOIN items i ON ml.item_id = i.id
             WHERE i.user_id = $1)
             ORDER BY timestamp DESC
             LIMIT 10`,
            [userId]
        );

        res.json({
            totalItems: parseInt(itemsResult.rows[0].total_items),
            totalListedItems: parseInt(itemsResult.rows[0].listed_items),
            totalValue: parseFloat(valueResult.rows[0].total_value),
            activeListings: parseInt(listingsResult.rows[0].active_listings),
            totalViews: parseInt(viewsResult.rows[0].total_views),
            totalRatings: parseInt(ratingsResult.rows[0].total_ratings),
            averageRating: parseFloat(ratingsResult.rows[0].average_rating),
            recentActivity: activityResult.rows
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 