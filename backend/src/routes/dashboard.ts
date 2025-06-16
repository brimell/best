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

        // Get total items count
        const itemsResult = await pool.query(
            'SELECT COUNT(*) as total_items FROM items WHERE user_id = $1',
            [userId]
        );

        // Get total value of inventory
        const valueResult = await pool.query(
            'SELECT COALESCE(SUM(price), 0) as total_value FROM items WHERE user_id = $1',
            [userId]
        );

        // Get active listings count
        const listingsResult = await pool.query(
            'SELECT COUNT(*) as active_listings FROM items WHERE user_id = $1 AND is_listed = true',
            [userId]
        );

        // Get total views
        const viewsResult = await pool.query(
            'SELECT COALESCE(SUM(view_count), 0) as total_views FROM items WHERE user_id = $1',
            [userId]
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
                'view' as type,
                'Item viewed' as description,
                i.last_viewed_at as timestamp,
                i.id
             FROM items i
             WHERE i.user_id = $1 AND i.last_viewed_at IS NOT NULL)
             ORDER BY timestamp DESC
             LIMIT 10`,
            [userId]
        );

        res.json({
            totalItems: parseInt(itemsResult.rows[0].total_items),
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