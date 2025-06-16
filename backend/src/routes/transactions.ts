import express from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Type guard to ensure user is defined
const ensureUser = (req: express.Request): req is express.Request & { user: { userId: number } } => {
    return req.user !== undefined;
};

// Get all transactions for a user (both as buyer and seller)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (!ensureUser(req)) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT t.*, 
                    i.name as item_name, i.description as item_description,
                    i.image_url, i.condition,
                    c.name as category_name,
                    buyer.username as buyer_name,
                    seller.username as seller_name
             FROM transactions t
             JOIN items i ON t.item_id = i.id
             JOIN categories c ON i.category_id = c.id
             JOIN users buyer ON t.buyer_id = buyer.id
             JOIN users seller ON t.seller_id = seller.id
             WHERE t.buyer_id = $1 OR t.seller_id = $1
             ORDER BY t.transaction_date DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new transaction (purchase an item)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (!ensureUser(req)) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const buyerId = req.user.userId;
        const { listing_id } = req.body;

        // Start a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get the listing details
            const listingResult = await client.query(
                `SELECT ml.*, i.user_id as seller_id
                 FROM marketplace_listings ml
                 JOIN items i ON ml.item_id = i.id
                 WHERE ml.id = $1 AND ml.status = 'active'`,
                [listing_id]
            );

            if (listingResult.rows.length === 0) {
                throw new Error('Listing not found or not active');
            }

            const listing = listingResult.rows[0];

            // Check if user is trying to buy their own item
            if (listing.seller_id === buyerId) {
                throw new Error('Cannot buy your own item');
            }

            // Create the transaction
            const transactionResult = await client.query(
                `INSERT INTO transactions (
                    listing_id, buyer_id, seller_id, item_id, price, status
                ) VALUES ($1, $2, $3, $4, $5, 'completed')
                RETURNING *`,
                [listing_id, buyerId, listing.seller_id, listing.item_id, listing.price]
            );

            // Update the listing status
            await client.query(
                'UPDATE marketplace_listings SET status = $1 WHERE id = $2',
                ['sold', listing_id]
            );

            // Update the item ownership
            await client.query(
                'UPDATE items SET user_id = $1 WHERE id = $2',
                [buyerId, listing.item_id]
            );

            await client.query('COMMIT');

            res.status(201).json(transactionResult.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating transaction:', error);
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Server error' });
        }
    }
});

// Get transaction details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        if (!ensureUser(req)) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const userId = req.user.userId;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT t.*, 
                    i.name as item_name, i.description as item_description,
                    i.image_url, i.condition,
                    c.name as category_name,
                    buyer.username as buyer_name,
                    seller.username as seller_name
             FROM transactions t
             JOIN items i ON t.item_id = i.id
             JOIN categories c ON i.category_id = c.id
             JOIN users buyer ON t.buyer_id = buyer.id
             JOIN users seller ON t.seller_id = seller.id
             WHERE t.id = $1 AND (t.buyer_id = $2 OR t.seller_id = $2)`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 