-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create items table (inventory)
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    purchase_price DECIMAL(10,2),
    purchase_date DATE,
    condition VARCHAR(50),
    location VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    price_point_category_id INTEGER REFERENCES price_point_categories(id) ON DELETE SET NULL
);

-- Create marketplace_listings table
CREATE TABLE marketplace_listings (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, sold, removed
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES marketplace_listings(id) ON DELETE SET NULL,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' -- completed, pending, cancelled
);

-- Create price_point_categories table
CREATE TABLE price_point_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    min_price DECIMAL(10,2) NOT NULL,
    max_price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create item_ratings table
CREATE TABLE item_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    review TEXT,
    price_point_category_id INTEGER REFERENCES price_point_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);

-- Create function to update item average rating
CREATE OR REPLACE FUNCTION update_item_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the item's average rating and total ratings count
    UPDATE items
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM item_ratings
            WHERE item_id = NEW.item_id
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM item_ratings
            WHERE item_id = NEW.item_id
        )
    WHERE id = NEW.item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update item ratings
CREATE TRIGGER update_item_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON item_ratings
FOR EACH ROW
EXECUTE FUNCTION update_item_rating();

-- Create view for top rated items by price point
CREATE VIEW top_rated_items_by_price AS
SELECT 
    i.id,
    i.name,
    i.description,
    i.average_rating,
    i.total_ratings,
    ppc.name as price_point_category,
    ppc.min_price,
    ppc.max_price,
    COUNT(DISTINCT ir.user_id) as number_of_reviews
FROM items i
JOIN price_point_categories ppc ON i.price_point_category_id = ppc.id
LEFT JOIN item_ratings ir ON i.id = ir.item_id
GROUP BY i.id, ppc.id
HAVING i.total_ratings >= 3  -- Only include items with at least 3 ratings
ORDER BY i.average_rating DESC, i.total_ratings DESC;

-- Create indexes for better query performance
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_marketplace_listings_item_id ON marketplace_listings(item_id);
CREATE INDEX idx_marketplace_listings_seller_id ON marketplace_listings(seller_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX idx_item_ratings_item_id ON item_ratings(item_id);
CREATE INDEX idx_item_ratings_user_id ON item_ratings(user_id);
CREATE INDEX idx_items_price_point_category ON items(price_point_category_id);
CREATE INDEX idx_items_average_rating ON items(average_rating DESC);

-- Insert some default price point categories
INSERT INTO price_point_categories (name, min_price, max_price, description) VALUES
    ('Budget', 0, 50, 'Affordable items under $50'),
    ('Mid-Range', 50.01, 200, 'Mid-priced items between $50 and $200'),
    ('Premium', 200.01, 500, 'Higher-end items between $200 and $500'),
    ('Luxury', 500.01, 1000, 'Luxury items between $500 and $1000'),
    ('Ultra-Premium', 1000.01, 999999.99, 'Ultra-premium items over $1000'); 