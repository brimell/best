import express from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all categories with hierarchy
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `WITH RECURSIVE category_tree AS (
                SELECT 
                    id,
                    parent_id,
                    name,
                    description,
                    level,
                    path,
                    ARRAY[name] as name_path
                FROM categories
                WHERE parent_id IS NULL
                
                UNION ALL
                
                SELECT 
                    c.id,
                    c.parent_id,
                    c.name,
                    c.description,
                    c.level,
                    c.path,
                    ct.name_path || c.name
                FROM categories c
                JOIN category_tree ct ON c.parent_id = ct.id
            )
            SELECT 
                id,
                parent_id,
                name,
                description,
                level,
                path,
                name_path,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM categories 
                        WHERE parent_id = category_tree.id
                    ) THEN true 
                    ELSE false 
                END as has_children
            FROM category_tree
            ORDER BY path`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single category with its children
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get the category
        const categoryResult = await pool.query(
            `WITH RECURSIVE category_tree AS (
                SELECT 
                    id,
                    parent_id,
                    name,
                    description,
                    level,
                    path,
                    ARRAY[name] as name_path
                FROM categories
                WHERE id = $1
                
                UNION ALL
                
                SELECT 
                    c.id,
                    c.parent_id,
                    c.name,
                    c.description,
                    c.level,
                    c.path,
                    ct.name_path || c.name
                FROM categories c
                JOIN category_tree ct ON c.parent_id = ct.id
            )
            SELECT 
                id,
                parent_id,
                name,
                description,
                level,
                path,
                name_path,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM categories 
                        WHERE parent_id = category_tree.id
                    ) THEN true 
                    ELSE false 
                END as has_children
            FROM category_tree
            ORDER BY path`,
            [id]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(categoryResult.rows);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new category
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, parent_id } = req.body;

        // Check if category already exists at the same level
        const existingCategory = await pool.query(
            'SELECT * FROM categories WHERE name = $1 AND parent_id IS NOT DISTINCT FROM $2',
            [name, parent_id || null]
        );

        if (existingCategory.rows.length > 0) {
            return res.status(400).json({ message: 'Category already exists at this level' });
        }

        // If parent_id is provided, verify it exists
        if (parent_id) {
            const parentCheck = await pool.query(
                'SELECT * FROM categories WHERE id = $1',
                [parent_id]
            );
            if (parentCheck.rows.length === 0) {
                return res.status(400).json({ message: 'Parent category not found' });
            }
        }

        const result = await pool.query(
            'INSERT INTO categories (name, description, parent_id) VALUES ($1, $2, $3) RETURNING *',
            [name, description, parent_id]
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
        const { name, description, parent_id } = req.body;

        // Check if category exists
        const categoryCheck = await pool.query(
            'SELECT * FROM categories WHERE id = $1',
            [id]
        );

        if (categoryCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if new parent_id would create a cycle
        if (parent_id) {
            const parentCheck = await pool.query(
                'SELECT path FROM categories WHERE id = $1',
                [parent_id]
            );
            if (parentCheck.rows.length === 0) {
                return res.status(400).json({ message: 'Parent category not found' });
            }
            if (parentCheck.rows[0].path.split('.').includes(id)) {
                return res.status(400).json({ message: 'Cannot move category to its own subcategory' });
            }
        }

        // Check if name already exists at the same level
        const existingCategory = await pool.query(
            'SELECT * FROM categories WHERE name = $1 AND parent_id IS NOT DISTINCT FROM $2 AND id != $3',
            [name, parent_id || null, id]
        );

        if (existingCategory.rows.length > 0) {
            return res.status(400).json({ message: 'Category name already exists at this level' });
        }

        const result = await pool.query(
            'UPDATE categories SET name = $1, description = $2, parent_id = $3 WHERE id = $4 RETURNING *',
            [name, description, parent_id, id]
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

        // Check if category has children
        const hasChildren = await pool.query(
            'SELECT COUNT(*) FROM categories WHERE parent_id = $1',
            [id]
        );

        if (parseInt(hasChildren.rows[0].count) > 0) {
            return res.status(400).json({
                message: 'Cannot delete category that has subcategories'
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