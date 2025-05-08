-- Create the search_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS search_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_query TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Composite unique constraint
  UNIQUE(search_query, platforms)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_search_cache_query_platforms 
ON search_cache(search_query, platforms);

-- Create index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_search_cache_expires_at 
ON search_cache(expires_at);
