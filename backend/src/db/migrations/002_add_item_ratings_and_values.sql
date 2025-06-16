-- Add new columns to items table
ALTER TABLE items
ADD COLUMN new_value DECIMAL(10,2),
ADD COLUMN resell_value DECIMAL(10,2);

-- Create item_ratings table
CREATE TABLE item_ratings (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    want_rating INTEGER CHECK (want_rating >= 0 AND want_rating <= 10),
    need_rating INTEGER CHECK (need_rating >= 0 AND need_rating <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, user_id)
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_item_ratings_updated_at
    BEFORE UPDATE ON item_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update categories with new hierarchy
TRUNCATE TABLE categories CASCADE;

-- Insert main categories
INSERT INTO categories (name, description, level, path) VALUES
('Audio Gear', 'Professional audio equipment and musical instruments', 1, 'audio-gear'),
('Tech Stack & Devices', 'Computers, peripherals, and electronic devices', 1, 'tech-stack-devices'),
('Kitchen', 'Kitchen appliances and cookware', 1, 'kitchen'),
('Clothes & Shoes', 'Clothing, footwear, and accessories', 1, 'clothes-shoes'),
('Bags & Travel Gear', 'Luggage, backpacks, and travel accessories', 1, 'bags-travel-gear'),
('Watches', 'Timepieces and watch accessories', 1, 'watches'),
('Misc', 'Miscellaneous items', 1, 'misc'),
('Perfume', 'Fragrances and perfumes', 1, 'perfume');

-- Insert subcategories for Audio Gear
INSERT INTO categories (name, description, parent_id, level, path) VALUES
('Microphones', 'Professional microphones and accessories', (SELECT id FROM categories WHERE name = 'Audio Gear'), 2, 'audio-gear/microphones'),
('Musical Instruments', 'Musical instruments and accessories', (SELECT id FROM categories WHERE name = 'Audio Gear'), 2, 'audio-gear/musical-instruments'),
('Audio Interfaces', 'Audio interfaces and recording equipment', (SELECT id FROM categories WHERE name = 'Audio Gear'), 2, 'audio-gear/audio-interfaces'),
('Headphones', 'Professional headphones and earphones', (SELECT id FROM categories WHERE name = 'Audio Gear'), 2, 'audio-gear/headphones'),
('Amplifiers', 'Guitar and audio amplifiers', (SELECT id FROM categories WHERE name = 'Audio Gear'), 2, 'audio-gear/amplifiers'),
('Accessories', 'Audio equipment accessories', (SELECT id FROM categories WHERE name = 'Audio Gear'), 2, 'audio-gear/accessories');

-- Insert subcategories for Tech Stack & Devices
INSERT INTO categories (name, description, parent_id, level, path) VALUES
('Computers', 'Desktop and laptop computers', (SELECT id FROM categories WHERE name = 'Tech Stack & Devices'), 2, 'tech-stack-devices/computers'),
('Mobile Devices', 'Smartphones and tablets', (SELECT id FROM categories WHERE name = 'Tech Stack & Devices'), 2, 'tech-stack-devices/mobile-devices'),
('Peripherals', 'Computer peripherals and accessories', (SELECT id FROM categories WHERE name = 'Tech Stack & Devices'), 2, 'tech-stack-devices/peripherals'),
('Gaming', 'Gaming equipment and accessories', (SELECT id FROM categories WHERE name = 'Tech Stack & Devices'), 2, 'tech-stack-devices/gaming'),
('Storage', 'Storage devices and solutions', (SELECT id FROM categories WHERE name = 'Tech Stack & Devices'), 2, 'tech-stack-devices/storage'),
('Networking', 'Networking equipment and accessories', (SELECT id FROM categories WHERE name = 'Tech Stack & Devices'), 2, 'tech-stack-devices/networking');

-- Insert subcategories for Kitchen
INSERT INTO categories (name, description, parent_id, level, path) VALUES
('Appliances', 'Kitchen appliances and equipment', (SELECT id FROM categories WHERE name = 'Kitchen'), 2, 'kitchen/appliances'),
('Cookware', 'Pots, pans, and cooking utensils', (SELECT id FROM categories WHERE name = 'Kitchen'), 2, 'kitchen/cookware'),
('Cutlery', 'Knives and cutting tools', (SELECT id FROM categories WHERE name = 'Kitchen'), 2, 'kitchen/cutlery'),
('Bakeware', 'Baking equipment and accessories', (SELECT id FROM categories WHERE name = 'Kitchen'), 2, 'kitchen/bakeware'),
('Storage', 'Food storage containers and solutions', (SELECT id FROM categories WHERE name = 'Kitchen'), 2, 'kitchen/storage'),
('Accessories', 'Kitchen accessories and tools', (SELECT id FROM categories WHERE name = 'Kitchen'), 2, 'kitchen/accessories');

-- Insert subcategories for Clothes & Shoes
INSERT INTO categories (name, description, parent_id, level, path) VALUES
('Outerwear', 'Jackets, coats, and outerwear', (SELECT id FROM categories WHERE name = 'Clothes & Shoes'), 2, 'clothes-shoes/outerwear'),
('Footwear', 'Shoes, boots, and footwear', (SELECT id FROM categories WHERE name = 'Clothes & Shoes'), 2, 'clothes-shoes/footwear'),
('Clothing', 'General clothing items', (SELECT id FROM categories WHERE name = 'Clothes & Shoes'), 2, 'clothes-shoes/clothing'),
('Accessories', 'Clothing accessories and add-ons', (SELECT id FROM categories WHERE name = 'Clothes & Shoes'), 2, 'clothes-shoes/accessories');

-- Insert subcategories for Bags & Travel Gear
INSERT INTO categories (name, description, parent_id, level, path) VALUES
('Backpacks', 'Backpacks and daypacks', (SELECT id FROM categories WHERE name = 'Bags & Travel Gear'), 2, 'bags-travel-gear/backpacks'),
('Luggage', 'Suitcases and travel bags', (SELECT id FROM categories WHERE name = 'Bags & Travel Gear'), 2, 'bags-travel-gear/luggage'),
('Travel Accessories', 'Travel accessories and organizers', (SELECT id FROM categories WHERE name = 'Bags & Travel Gear'), 2, 'bags-travel-gear/travel-accessories'),
('Tech Bags', 'Bags for electronic devices', (SELECT id FROM categories WHERE name = 'Bags & Travel Gear'), 2, 'bags-travel-gear/tech-bags');

-- Insert subcategories for Watches
INSERT INTO categories (name, description, parent_id, level, path) VALUES
('Luxury Watches', 'High-end timepieces', (SELECT id FROM categories WHERE name = 'Watches'), 2, 'watches/luxury-watches'),
('Smart Watches', 'Smart and digital watches', (SELECT id FROM categories WHERE name = 'Watches'), 2, 'watches/smart-watches'),
('Watch Accessories', 'Watch accessories and parts', (SELECT id FROM categories WHERE name = 'Watches'), 2, 'watches/watch-accessories');

-- Insert subcategories for Misc
INSERT INTO categories (name, description, parent_id, level, path) VALUES
('Sports Equipment', 'Sports and fitness equipment', (SELECT id FROM categories WHERE name = 'Misc'), 2, 'misc/sports-equipment'),
('Home Appliances', 'Home appliances and equipment', (SELECT id FROM categories WHERE name = 'Misc'), 2, 'misc/home-appliances'),
('Tools', 'Tools and equipment', (SELECT id FROM categories WHERE name = 'Misc'), 2, 'misc/tools'),
('Collectibles', 'Collectible items and memorabilia', (SELECT id FROM categories WHERE name = 'Misc'), 2, 'misc/collectibles');

-- Insert subcategories for Perfume
INSERT INTO categories (name, description, parent_id, level, path) VALUES
('Men''s Fragrances', 'Men''s perfumes and colognes', (SELECT id FROM categories WHERE name = 'Perfume'), 2, 'perfume/mens-fragrances'),
('Women''s Fragrances', 'Women''s perfumes and fragrances', (SELECT id FROM categories WHERE name = 'Perfume'), 2, 'perfume/womens-fragrances'),
('Unisex Fragrances', 'Unisex perfumes and fragrances', (SELECT id FROM categories WHERE name = 'Perfume'), 2, 'perfume/unisex-fragrances');

-- Create indexes for better performance
CREATE INDEX idx_item_ratings_item_id ON item_ratings(item_id);
CREATE INDEX idx_item_ratings_user_id ON item_ratings(user_id);
CREATE INDEX idx_items_new_value ON items(new_value);
CREATE INDEX idx_items_resell_value ON items(resell_value); 