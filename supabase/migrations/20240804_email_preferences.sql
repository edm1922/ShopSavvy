-- Migration to add email preferences to profiles table

-- Check if profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    -- Create profiles table if it doesn't exist
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id),
      email TEXT,
      full_name TEXT,
      avatar_url TEXT,
      email_preferences JSONB DEFAULT '{"priceAlerts": true, "weeklyDigest": true, "specialOffers": false, "accountNotifications": true}'::JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable Row Level Security
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can read their own profile" 
      ON profiles 
      FOR SELECT 
      USING (auth.uid() = id);
    
    CREATE POLICY "Users can update their own profile" 
      ON profiles 
      FOR UPDATE 
      USING (auth.uid() = id);
    
    -- Create trigger to create profile on user creation
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, avatar_url)
      VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  ELSE
    -- Add email_preferences column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_preferences') THEN
      ALTER TABLE profiles ADD COLUMN email_preferences JSONB DEFAULT '{"priceAlerts": true, "weeklyDigest": true, "specialOffers": false, "accountNotifications": true}'::JSONB;
    END IF;
  END IF;
END
$$;
