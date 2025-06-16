import express from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all items for a user
router.get('/', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { category_id, search, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

        let query = `
            SELECT 
                i.*,
                c.name as category_name,
                c.path as category_path,
                COALESCE(AVG(ir.want_rating), 0) as avg_want_rating,
                COALESCE(AVG(ir.need_rating), 0) as avg_need_rating,
                COUNT(DISTINCT ir.id) as rating_count,
                (
                    SELECT json_build_object(
                        'want_rating', want_rating,
                        'need_rating', need_rating
                    )
                    FROM item_ratings
                    WHERE item_id = i.id AND user_id = $1
                ) as user_rating
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN item_ratings ir ON i.id = ir.item_id
        `;

        const queryParams = [req.user.id];
        let whereClause = 'WHERE i.user_id = $1';
        let paramCount = 1;

        if (category_id) {
            paramCount++;
            whereClause += ` AND i.category_id = $${paramCount}`;
            queryParams.push(category_id);
        }

        if (search) {
            paramCount++;
            whereClause += ` AND (i.name ILIKE $${paramCount} OR i.description ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
        }

        query += whereClause + ' GROUP BY i.id, c.name, c.path';

        // Add sorting
        const validSortColumns = ['created_at', 'name', 'new_value', 'resell_value', 'avg_want_rating', 'avg_need_rating'];
        const sortColumn = validSortColumns.includes(sort_by as string) ? sort_by : 'created_at';
        const order = sort_order === 'ASC' ? 'ASC' : 'DESC';
        
        query += ` ORDER BY ${sortColumn} ${order}`;

        const result = await client.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Error fetching items' });
    } finally {
        client.release();
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
    const client = await pool.connect();
    try {
        const {
            name,
            description,
            category_id,
            quantity,
            condition,
            location,
            image_url,
            new_value,
            resell_value
        } = req.body;

        const result = await client.query(
            `INSERT INTO items (
                name, description, category_id, quantity, condition, 
                location, image_url, user_id, new_value, resell_value
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *`,
            [name, description, category_id, quantity, condition, location, image_url, req.user.id, new_value, resell_value]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Error creating item' });
    } finally {
        client.release();
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

// Add new endpoint for rating items
router.post('/:id/rate', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { want_rating, need_rating } = req.body;

        // Validate ratings
        if (want_rating < 0 || want_rating > 10 || need_rating < 0 || need_rating > 10) {
            return res.status(400).json({ error: 'Ratings must be between 0 and 10' });
        }

        // Check if item exists
        const itemCheck = await client.query('SELECT id FROM items WHERE id = $1', [id]);
        if (itemCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Upsert rating
        const result = await client.query(
            `INSERT INTO item_ratings (item_id, user_id, want_rating, need_rating)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (item_id, user_id) 
             DO UPDATE SET 
               want_rating = EXCLUDED.want_rating,
               need_rating = EXCLUDED.need_rating,
               updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [id, req.user.id, want_rating, need_rating]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error rating item:', error);
        res.status(500).json({ error: 'Error rating item' });
    } finally {
        client.release();
    }
});

// Add endpoint to get item ratings
router.get('/:id/ratings', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        const result = await client.query(
            `SELECT 
                ir.*,
                u.username,
                i.name as item_name
               FROM item_ratings ir
               JOIN users u ON ir.user_id = u.id
               JOIN items i ON ir.item_id = i.id
               WHERE ir.item_id = $1
               ORDER BY ir.updated_at DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching item ratings:', error);
        res.status(500).json({ error: 'Error fetching item ratings' });
    } finally {
        client.release();
    }
});

export default router; 