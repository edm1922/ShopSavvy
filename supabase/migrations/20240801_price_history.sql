-- Migration for price history tracking
-- This table stores historical price data for products

-- Create the price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  platform TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_price_history_product_id 
ON price_history(product_id);

CREATE INDEX IF NOT EXISTS idx_price_history_user_id 
ON price_history(user_id);

CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at 
ON price_history(recorded_at);

-- Create a composite index for user_id and product_id
CREATE INDEX IF NOT EXISTS idx_price_history_user_product 
ON price_history(user_id, product_id);

-- Enable Row Level Security
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy to allow users to read their own price history
CREATE POLICY "Users can read their own price history" 
  ON price_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own price history
CREATE POLICY "Users can insert their own price history" 
  ON price_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add a comment to the table
COMMENT ON TABLE price_history IS 'Historical price data for tracked products';
