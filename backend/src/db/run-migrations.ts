import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'inventory_marketplace',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function runMigration(filename: string) {
    const client = await pool.connect();
    try {
        console.log(`Running migration: ${filename}`);
        const filePath = path.join(__dirname, 'migrations', filename);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        
        console.log(`Successfully ran migration: ${filename}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error running migration ${filename}:`, error);
        throw error;
    } finally {
        client.release();
    }
}

async function runMigrations() {
    const migrations = [
        '001_add_category_hierarchy.sql',
        '002_add_item_ratings_and_values.sql',
        '003_add_is_admin_to_users.sql'
    ];

    for (const migration of migrations) {
        try {
            await runMigration(migration);
        } catch (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    }

    console.log('All migrations completed successfully');
    process.exit(0);
}

runMigrations(); 