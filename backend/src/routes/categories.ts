import express from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all categories
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM categories ORDER BY name'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new category
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if category already exists
        const existingCategory = await pool.query(
            'SELECT * FROM categories WHERE name = $1',
            [name]
        );

        if (existingCategory.rows.length > 0) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const result = await pool.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a category
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Check if category exists
        const checkResult = await pool.query(
            'SELECT * FROM categories WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if new name conflicts with existing category
        if (name !== checkResult.rows[0].name) {
            const nameConflict = await pool.query(
                'SELECT * FROM categories WHERE name = $1 AND id != $2',
                [name, id]
            );

            if (nameConflict.rows.length > 0) {
                return res.status(400).json({ message: 'Category name already exists' });
            }
        }

        const result = await pool.query(
            'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name, description, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a category
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category is in use
        const itemsUsingCategory = await pool.query(
            'SELECT COUNT(*) FROM items WHERE category_id = $1',
            [id]
        );

        if (parseInt(itemsUsingCategory.rows[0].count) > 0) {
            return res.status(400).json({
                message: 'Cannot delete category that is in use by items'
            });
        }

        const result = await pool.query(
            'DELETE FROM categories WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 