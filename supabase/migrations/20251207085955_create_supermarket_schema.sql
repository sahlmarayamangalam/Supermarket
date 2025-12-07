/*
  # Supermarket Management System Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `phone` (text, unique) - User's phone number
      - `name` (text) - User's full name
      - `language` (text) - Preferred language (malayalam/english)
      - `role` (text) - User role (user/manager)
      - `is_online` (boolean) - Track online status
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text) - Product name
      - `category` (text) - Product category
      - `mrp` (decimal) - Maximum Retail Price
      - `image_url` (text) - Product image URL
      - `stock` (integer) - Available stock
      - `offer_text` (text) - Offer description
      - `available` (boolean) - Product availability
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `carts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Reference to users
      - `product_id` (uuid, foreign key) - Reference to products
      - `quantity` (integer) - Quantity in cart
      - `created_at` (timestamp)
    
    - `bills`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Reference to users (customer)
      - `manager_id` (uuid, foreign key) - Reference to users (manager who created bill)
      - `items` (jsonb) - Bill items with details
      - `total_amount` (decimal) - Total bill amount
      - `status` (text) - Bill status (pending/sent)
      - `created_at` (timestamp)
    
    - `manager_settings`
      - `id` (uuid, primary key)
      - `password` (text) - Manager password
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  language text DEFAULT 'english',
  role text DEFAULT 'user',
  is_online boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  mrp decimal(10,2) NOT NULL,
  image_url text DEFAULT '',
  stock integer DEFAULT 0,
  offer_text text DEFAULT '',
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES users(id) ON DELETE CASCADE,
  items jsonb NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manager_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password text NOT NULL DEFAULT 'user@123',
  updated_at timestamptz DEFAULT now()
);

-- Insert default manager password
INSERT INTO manager_settings (password) VALUES ('user@123');

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Anyone can view users"
  ON users FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update users"
  ON users FOR UPDATE
  TO anon
  USING (true);

-- Products policies
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert products"
  ON products FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update products"
  ON products FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anyone can delete products"
  ON products FOR DELETE
  TO anon
  USING (true);

-- Carts policies
CREATE POLICY "Anyone can view carts"
  ON carts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert into carts"
  ON carts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update carts"
  ON carts FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anyone can delete from carts"
  ON carts FOR DELETE
  TO anon
  USING (true);

-- Bills policies
CREATE POLICY "Anyone can view bills"
  ON bills FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert bills"
  ON bills FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update bills"
  ON bills FOR UPDATE
  TO anon
  USING (true);

-- Manager settings policies
CREATE POLICY "Anyone can view manager settings"
  ON manager_settings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can update manager settings"
  ON manager_settings FOR UPDATE
  TO anon
  USING (true);
