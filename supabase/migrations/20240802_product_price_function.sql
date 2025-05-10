-- Migration to create a function for getting product prices
-- This function will be called by the Edge Function to get current prices

-- Create the function to get product price
CREATE OR REPLACE FUNCTION get_product_price(
  product_id TEXT,
  platform TEXT,
  product_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- For now, we'll use a simple approach to get the price from the search_cache table
  -- In a production environment, you would implement a more robust solution
  -- that actually scrapes the product page or calls an external API
  
  -- Try to find the product in the search cache
  SELECT jsonb_build_object(
    'product_id', product_id,
    'platform', platform,
    'price', (jsonb_array_elements(results)->>'price')::DECIMAL
  ) INTO result
  FROM search_cache
  WHERE results @> jsonb_build_array(jsonb_build_object('id', product_id))
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If not found in search_cache, try serper_search_cache
  IF result IS NULL THEN
    SELECT jsonb_build_object(
      'product_id', product_id,
      'platform', platform,
      'price', (jsonb_array_elements(results->'shopping')->>'price')::TEXT
    ) INTO result
    FROM serper_search_cache
    WHERE results->'shopping' @> jsonb_build_array(jsonb_build_object('productId', product_id))
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- If still not found, return a default response
  IF result IS NULL THEN
    result := jsonb_build_object(
      'product_id', product_id,
      'platform', platform,
      'price', NULL,
      'error', 'Product not found in cache'
    );
  END IF;
  
  RETURN result;
END;
$$;
