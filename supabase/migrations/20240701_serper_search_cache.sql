-- Migration for Serper.dev API search cache
-- This table stores cached search results from the Serper.dev API

-- Create the serper_search_cache table
CREATE TABLE IF NOT EXISTS serper_search_cache (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'ph',
  language TEXT NOT NULL DEFAULT 'en',
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Create a unique constraint on query, country, and language
  UNIQUE(query, country, language)
);

-- Create an index on the query column for faster lookups
CREATE INDEX IF NOT EXISTS idx_serper_search_cache_query ON serper_search_cache(query);

-- Create an index on the created_at column for expiration queries
CREATE INDEX IF NOT EXISTS idx_serper_search_cache_created_at ON serper_search_cache(created_at);

-- Add a comment to the table
COMMENT ON TABLE serper_search_cache IS 'Cached search results from the Serper.dev API';
