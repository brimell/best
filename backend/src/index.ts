/// <reference types="node" />
// @ts-ignore
import express, { Request, Response } from 'express';
// @ts-ignore
import cors from 'cors';
// @ts-ignore
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Import routes (we'll create these next)
import authRoutes from './routes/auth';
import itemRoutes from './routes/items';
import categoryRoutes from './routes/categories';
import marketplaceRoutes from './routes/marketplace';
import transactionRoutes from './routes/transactions';
import ratingRoutes from './routes/ratings';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Dummy inventory (in a real app, you'd query a database)
const inventory = [
  { id: 1, name: 'Laptop', quantity: 1, category: 'Electronics' },
  { id: 2, name: 'Desk Chair', quantity: 1, category: 'Furniture' },
  { id: 3, name: 'Coffee Mug', quantity: 2, category: 'Kitchen' }
];

// Dummy marketplace (in a real app, you'd query a database or external API)
const marketplace = [
  { id: 1, name: 'Best Laptop 2023', price: 1200, category: 'Electronics', rating: 4.5 },
  { id: 2, name: 'Ergonomic Chair', price: 250, category: 'Furniture', rating: 4.8 },
  { id: 3, name: 'Stainless Steel Mug', price: 15, category: 'Kitchen', rating: 4.2 }
];

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ratings', ratingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Endpoint to get inventory (GET /api/inventory)
app.get('/api/inventory', (req: Request, res: Response) => {
  res.json(inventory);
});

// Endpoint to get marketplace (GET /api/marketplace)
app.get('/api/marketplace', (req: Request, res: Response) => {
  res.json(marketplace);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 