-- Create profiles table to store user profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS (Row Level Security) policies for the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own profile
CREATE POLICY "Users can read their own profile" 
  ON profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when a new user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create saved_products table to store user's saved/favorite products
CREATE TABLE IF NOT EXISTS saved_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  image_url TEXT,
  price DECIMAL(10, 2),
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for saved_products
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own saved products
CREATE POLICY "Users can read their own saved products" 
  ON saved_products 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own saved products
CREATE POLICY "Users can insert their own saved products" 
  ON saved_products 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own saved products
CREATE POLICY "Users can delete their own saved products" 
  ON saved_products 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create price_alerts table to store user's price alerts
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  target_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  product_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for price_alerts
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own price alerts
CREATE POLICY "Users can read their own price alerts" 
  ON price_alerts 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own price alerts
CREATE POLICY "Users can insert their own price alerts" 
  ON price_alerts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own price alerts
CREATE POLICY "Users can update their own price alerts" 
  ON price_alerts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own price alerts
CREATE POLICY "Users can delete their own price alerts" 
  ON price_alerts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create search_history table to store user's search history
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for search_history
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own search history
CREATE POLICY "Users can read their own search history" 
  ON search_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert into their own search history
CREATE POLICY "Users can insert into their own search history" 
  ON search_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own search history
CREATE POLICY "Users can delete their own search history" 
  ON search_history 
  FOR DELETE 
  USING (auth.uid() = user_id);
