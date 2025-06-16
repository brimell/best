-- Drop existing categories table and recreate with hierarchy support
DROP TABLE IF EXISTS items CASCADE;  -- Drop items first due to foreign key
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, name)  -- Ensure unique names within the same parent
);

-- Create function to update category path
CREATE OR REPLACE FUNCTION update_category_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path := NEW.id::TEXT;
        NEW.level := 1;
    ELSE
        SELECT path, level INTO NEW.path, NEW.level
        FROM categories
        WHERE id = NEW.parent_id;
        NEW.path := NEW.path || '.' || NEW.id::TEXT;
        NEW.level := NEW.level + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update category path
CREATE TRIGGER update_category_path_trigger
BEFORE INSERT OR UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_category_path();

-- Recreate items table with updated foreign key
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

-- Create index for category path
CREATE INDEX idx_categories_path ON categories(path);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);

-- Insert main categories
INSERT INTO categories (name, description) VALUES
    ('Electronics', 'Electronic devices and accessories'),
    ('Furniture', 'Home and office furniture'),
    ('Clothing', 'Apparel and fashion items'),
    ('Books & Media', 'Books, movies, music, and other media'),
    ('Sports & Outdoors', 'Sports equipment and outdoor gear'),
    ('Home & Garden', 'Home decor and garden supplies'),
    ('Toys & Games', 'Toys, games, and entertainment items'),
    ('Collectibles', 'Collectible items and memorabilia'),
    ('Jewelry & Watches', 'Fine jewelry and timepieces'),
    ('Art & Crafts', 'Art supplies and craft materials'),
    ('Automotive', 'Vehicle parts and accessories'),
    ('Musical Instruments', 'Musical instruments and equipment'),
    ('Tools & Equipment', 'Tools and professional equipment'),
    ('Health & Beauty', 'Health and beauty products'),
    ('Food & Beverage', 'Food items and beverages');

-- Insert Electronics subcategories
WITH electronics AS (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM electronics), 'Computers & Laptops', 'Desktop computers, laptops, and accessories'),
    ((SELECT id FROM electronics), 'Smartphones & Accessories', 'Mobile phones and related accessories'),
    ((SELECT id FROM electronics), 'Audio Equipment', 'Speakers, headphones, and audio systems'),
    ((SELECT id FROM electronics), 'TVs & Video', 'Televisions and video equipment'),
    ((SELECT id FROM electronics), 'Gaming', 'Gaming consoles and accessories'),
    ((SELECT id FROM electronics), 'Cameras & Photography', 'Cameras and photography equipment'),
    ((SELECT id FROM electronics), 'Networking', 'Network equipment and accessories'),
    ((SELECT id FROM electronics), 'Components', 'Computer and electronic components');

-- Insert Computers & Laptops subcategories
WITH computers AS (SELECT id FROM categories WHERE name = 'Computers & Laptops' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM computers), 'Desktop Computers', 'Complete desktop systems'),
    ((SELECT id FROM computers), 'Laptops', 'Portable computers'),
    ((SELECT id FROM computers), 'Tablets', 'Tablet computers and accessories'),
    ((SELECT id FROM computers), 'Computer Components', 'Individual computer parts'),
    ((SELECT id FROM computers), 'Computer Accessories', 'Peripherals and accessories');

-- Insert Furniture subcategories
WITH furniture AS (SELECT id FROM categories WHERE name = 'Furniture' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM furniture), 'Living Room', 'Sofas, chairs, and living room furniture'),
    ((SELECT id FROM furniture), 'Bedroom', 'Beds, dressers, and bedroom furniture'),
    ((SELECT id FROM furniture), 'Dining Room', 'Dining tables and chairs'),
    ((SELECT id FROM furniture), 'Office', 'Desks, chairs, and office furniture'),
    ((SELECT id FROM furniture), 'Outdoor', 'Patio and garden furniture'),
    ((SELECT id FROM furniture), 'Storage', 'Cabinets, shelves, and storage solutions');

-- Insert Clothing subcategories
WITH clothing AS (SELECT id FROM categories WHERE name = 'Clothing' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM clothing), 'Men''s Clothing', 'Men''s apparel and accessories'),
    ((SELECT id FROM clothing), 'Women''s Clothing', 'Women''s apparel and accessories'),
    ((SELECT id FROM clothing), 'Children''s Clothing', 'Kids'' and baby clothing'),
    ((SELECT id FROM clothing), 'Footwear', 'Shoes, boots, and other footwear'),
    ((SELECT id FROM clothing), 'Accessories', 'Clothing accessories and add-ons'),
    ((SELECT id FROM clothing), 'Sportswear', 'Athletic and sports clothing');

-- Insert Books & Media subcategories
WITH media AS (SELECT id FROM categories WHERE name = 'Books & Media' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM media), 'Books', 'Fiction and non-fiction books'),
    ((SELECT id FROM media), 'Movies', 'DVDs and Blu-rays'),
    ((SELECT id FROM media), 'Music', 'CDs and vinyl records'),
    ((SELECT id FROM media), 'Video Games', 'Physical video games'),
    ((SELECT id FROM media), 'Comics & Manga', 'Comic books and manga'),
    ((SELECT id FROM media), 'Magazines', 'Periodicals and magazines');

-- Insert Sports & Outdoors subcategories
WITH sports AS (SELECT id FROM categories WHERE name = 'Sports & Outdoors' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM sports), 'Exercise & Fitness', 'Fitness equipment and accessories'),
    ((SELECT id FROM sports), 'Team Sports', 'Equipment for team sports'),
    ((SELECT id FROM sports), 'Outdoor Recreation', 'Camping and outdoor gear'),
    ((SELECT id FROM sports), 'Cycling', 'Bicycles and cycling equipment'),
    ((SELECT id FROM sports), 'Water Sports', 'Swimming and water sports equipment'),
    ((SELECT id FROM sports), 'Winter Sports', 'Skiing and snowboarding equipment');

-- Insert Home & Garden subcategories
WITH home AS (SELECT id FROM categories WHERE name = 'Home & Garden' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM home), 'Home Decor', 'Decorative items and accessories'),
    ((SELECT id FROM home), 'Kitchen & Dining', 'Kitchen appliances and dining items'),
    ((SELECT id FROM home), 'Bedding & Bath', 'Bedding and bathroom accessories'),
    ((SELECT id FROM home), 'Garden Supplies', 'Plants and gardening tools'),
    ((SELECT id FROM home), 'Lighting', 'Lamps and lighting fixtures'),
    ((SELECT id FROM home), 'Storage & Organization', 'Storage solutions and organizers');

-- Insert Toys & Games subcategories
WITH toys AS (SELECT id FROM categories WHERE name = 'Toys & Games' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM toys), 'Board Games', 'Traditional board games'),
    ((SELECT id FROM toys), 'Video Games', 'Video game consoles and games'),
    ((SELECT id FROM toys), 'Action Figures', 'Action figures and collectible toys'),
    ((SELECT id FROM toys), 'Building Toys', 'Construction and building sets'),
    ((SELECT id FROM toys), 'Educational Toys', 'Learning and educational toys'),
    ((SELECT id FROM toys), 'Outdoor Toys', 'Toys for outdoor play');

-- Insert Collectibles subcategories
WITH collectibles AS (SELECT id FROM categories WHERE name = 'Collectibles' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM collectibles), 'Trading Cards', 'Sports and trading cards'),
    ((SELECT id FROM collectibles), 'Coins & Currency', 'Collectible coins and currency'),
    ((SELECT id FROM collectibles), 'Stamps', 'Postage stamps and philately'),
    ((SELECT id FROM collectibles), 'Action Figures', 'Collectible action figures'),
    ((SELECT id FROM collectibles), 'Memorabilia', 'Sports and entertainment memorabilia'),
    ((SELECT id FROM collectibles), 'Art Prints', 'Limited edition art prints');

-- Insert Jewelry & Watches subcategories
WITH jewelry AS (SELECT id FROM categories WHERE name = 'Jewelry & Watches' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM jewelry), 'Fine Jewelry', 'Precious metal and gemstone jewelry'),
    ((SELECT id FROM jewelry), 'Fashion Jewelry', 'Costume and fashion jewelry'),
    ((SELECT id FROM jewelry), 'Watches', 'Wristwatches and timepieces'),
    ((SELECT id FROM jewelry), 'Necklaces', 'Necklaces and pendants'),
    ((SELECT id FROM jewelry), 'Rings', 'Rings and bands'),
    ((SELECT id FROM jewelry), 'Earrings', 'Earrings and ear accessories');

-- Insert Art & Crafts subcategories
WITH art AS (SELECT id FROM categories WHERE name = 'Art & Crafts' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM art), 'Art Supplies', 'Paints, brushes, and art materials'),
    ((SELECT id FROM art), 'Craft Supplies', 'Crafting materials and tools'),
    ((SELECT id FROM art), 'Sewing & Fabric', 'Sewing supplies and fabric'),
    ((SELECT id FROM art), 'Scrapbooking', 'Scrapbooking supplies'),
    ((SELECT id FROM art), 'Drawing & Sketching', 'Drawing materials and tools'),
    ((SELECT id FROM art), 'Knitting & Crochet', 'Yarn and knitting supplies');

-- Insert Automotive subcategories
WITH auto AS (SELECT id FROM categories WHERE name = 'Automotive' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM auto), 'Car Parts', 'Automotive parts and components'),
    ((SELECT id FROM auto), 'Tools & Equipment', 'Automotive tools and equipment'),
    ((SELECT id FROM auto), 'Accessories', 'Car accessories and add-ons'),
    ((SELECT id FROM auto), 'Motorcycle Parts', 'Motorcycle parts and accessories'),
    ((SELECT id FROM auto), 'Tires & Wheels', 'Tires, wheels, and related items'),
    ((SELECT id FROM auto), 'Car Care', 'Cleaning and maintenance products');

-- Insert Musical Instruments subcategories
WITH music AS (SELECT id FROM categories WHERE name = 'Musical Instruments' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM music), 'String Instruments', 'Guitars, violins, and string instruments'),
    ((SELECT id FROM music), 'Wind Instruments', 'Flutes, saxophones, and wind instruments'),
    ((SELECT id FROM music), 'Percussion', 'Drums and percussion instruments'),
    ((SELECT id FROM music), 'Keyboards', 'Pianos and electronic keyboards'),
    ((SELECT id FROM music), 'Pro Audio', 'Professional audio equipment'),
    ((SELECT id FROM music), 'Accessories', 'Instrument accessories and parts');

-- Insert Tools & Equipment subcategories
WITH tools AS (SELECT id FROM categories WHERE name = 'Tools & Equipment' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM tools), 'Power Tools', 'Electric and power tools'),
    ((SELECT id FROM tools), 'Hand Tools', 'Manual and hand tools'),
    ((SELECT id FROM tools), 'Garden Tools', 'Gardening and landscaping tools'),
    ((SELECT id FROM tools), 'Measuring Tools', 'Measurement and precision tools'),
    ((SELECT id FROM tools), 'Safety Equipment', 'Safety gear and equipment'),
    ((SELECT id FROM tools), 'Tool Storage', 'Tool storage and organization');

-- Insert Health & Beauty subcategories
WITH health AS (SELECT id FROM categories WHERE name = 'Health & Beauty' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM health), 'Skincare', 'Skin care products and treatments'),
    ((SELECT id FROM health), 'Hair Care', 'Hair care products and accessories'),
    ((SELECT id FROM health), 'Makeup', 'Cosmetics and makeup products'),
    ((SELECT id FROM health), 'Fragrances', 'Perfumes and colognes'),
    ((SELECT id FROM health), 'Health Care', 'Health and wellness products'),
    ((SELECT id FROM health), 'Personal Care', 'Personal hygiene products');

-- Insert Food & Beverage subcategories
WITH food AS (SELECT id FROM categories WHERE name = 'Food & Beverage' LIMIT 1)
INSERT INTO categories (parent_id, name, description) VALUES
    ((SELECT id FROM food), 'Gourmet Foods', 'Specialty and gourmet food items'),
    ((SELECT id FROM food), 'Beverages', 'Drinks and beverages'),
    ((SELECT id FROM food), 'Baking Supplies', 'Baking ingredients and tools'),
    ((SELECT id FROM food), 'Cooking Supplies', 'Cooking equipment and utensils'),
    ((SELECT id FROM food), 'Specialty Foods', 'Special dietary and specialty foods'),
    ((SELECT id FROM food), 'Food Storage', 'Food storage containers and solutions'); 