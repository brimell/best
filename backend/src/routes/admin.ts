import express, { Request } from 'express';
import multer from 'multer';
import csvParse from 'csv-parse';
import pool from '../config/database';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/admin/import-items
router.post('/import-items', authenticateToken, isAdmin, upload.single('file'), async (req: Request, res) => {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const csv = file.buffer.toString('utf-8');
    const records: any[] = [];
    try {
        await new Promise<void>((resolve, reject) => {
            csvParse(csv, { columns: true, trim: true }, (err: Error | undefined, output: any[]) => {
                if (err) return reject(err);
                output.forEach((row: any) => records.push(row));
                resolve();
            });
        });
    } catch (err: any) {
        return res.status(400).json({ message: 'CSV parse error', error: err.message });
    }
    let imported = 0, failed = 0, errors: { row: any, error: string }[] = [];
    for (const row of records) {
        try {
            // Find or create category
            let categoryId = null;
            if (row.Category) {
                const catRes = await pool.query('SELECT id FROM categories WHERE name = $1', [row.Category]);
                if (catRes.rows.length > 0) {
                    categoryId = catRes.rows[0].id;
                } else {
                    const newCat = await pool.query('INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id', [row.Category, row.Category]);
                    categoryId = newCat.rows[0].id;
                }
            }
            // Insert item
            const itemRes = await pool.query(
                `INSERT INTO items (user_id, category_id, name, description, quantity, purchase_price, new_value, resell_value, condition, location, image_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
                [req.user!.userId, categoryId, row.Item, row.Description || '', 1, row['Purchased Price (£)'] || row['Purchase Value (£)'] || 0, row['Value (New) (£)'] || 0, row['Resell Value (£)'] || 0, row.Condition || '', row.Location || '', row.ImageUrl || '']
            );
            const itemId = itemRes.rows[0].id;
            // Create marketplace listing
            await pool.query(
                `INSERT INTO marketplace_listings (item_id, seller_id, price, status, description)
                 VALUES ($1, $2, $3, 'active', $4)`,
                [itemId, req.user!.userId, row['Resell Value (£)'] || 0, row.Description || '']
            );
            // Add want/need rating if present
            if (row['Want scale (0-10)'] || row['Need Scale (0-10)']) {
                await pool.query(
                    `INSERT INTO item_ratings (item_id, user_id, want_rating, need_rating)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (item_id, user_id) DO UPDATE SET want_rating = $3, need_rating = $4, updated_at = CURRENT_TIMESTAMP`,
                    [itemId, req.user!.userId, row['Want scale (0-10)'] || 0, row['Need Scale (0-10)'] || 0]
                );
            }
            imported++;
        } catch (err: any) {
            failed++;
            errors.push({ row, error: err.message });
        }
    }
    res.json({ imported, failed, errors });
});

export default router; 