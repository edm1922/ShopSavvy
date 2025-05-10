/**
 * DeepSeek AI Recommendations Service
 *
 * This service provides AI-powered recommendations for fashion and beauty products
 * using the DeepSeek API.
 */

import { Product } from '@/services/types';

/**
 * Interface for recommendation request parameters
 */
export interface RecommendationParams {
  query?: string;
  userPreferences?: string[];
  recentSearches?: string[];
  recentlyViewedProducts?: Product[];
  budget?: {
    min?: number;
    max?: number;
  };
  category?: string;
}

/**
 * Interface for recommendation response
 */
export interface RecommendationResponse {
  recommendations: string[];
  suggestedSearches: string[];
  explanation: string;
  trendingItems?: string[];
}

/**
 * Gets AI-powered recommendations based on user preferences and behavior
 *
 * @param params The recommendation parameters
 * @returns A promise that resolves to recommendation data
 */
export async function getRecommendations(
  params: RecommendationParams
): Promise<RecommendationResponse> {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error('DeepSeek API key is not configured');
    }

    // Construct the prompt for DeepSeek
    const prompt = constructRecommendationPrompt(params);

    // Call the DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a fashion and beauty recommendation assistant for ShopSavvy, a shopping companion app. Your goal is to provide personalized product recommendations and search suggestions based on user preferences and behavior.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Parse the AI response
    return parseRecommendationResponse(data.choices[0].message.content);
  } catch (error) {
    console.error('[DeepSeekRecommendations] Error getting recommendations:', error);

    // Return fallback recommendations
    return {
      recommendations: [
        'Explore trending summer dresses',
        'Check out new arrivals in footwear',
        'Browse sustainable fashion collections'
      ],
      suggestedSearches: [
        'casual outfits',
        'office wear',
        'summer fashion'
      ],
      explanation: 'Based on popular fashion trends for the current season.'
    };
  }
}

/**
 * Constructs a prompt for the DeepSeek API based on user parameters
 *
 * @param params The recommendation parameters
 * @returns A string prompt for the AI
 */
function constructRecommendationPrompt(params: RecommendationParams): string {
  const {
    query,
    userPreferences = [],
    recentSearches = [],
    recentlyViewedProducts = [],
    budget,
    category
  } = params;

  let prompt = 'Please provide personalized fashion and beauty recommendations based on the following information:\n\n';

  if (query) {
    prompt += `Current search query: "${query}"\n\n`;
  }

  if (userPreferences.length > 0) {
    prompt += `User preferences: ${userPreferences.join(', ')}\n\n`;
  }

  if (recentSearches.length > 0) {
    prompt += `Recent searches: ${recentSearches.join(', ')}\n\n`;
  }

  if (recentlyViewedProducts.length > 0) {
    prompt += 'Recently viewed products:\n';
    recentlyViewedProducts.forEach(product => {
      prompt += `- ${product.title} (${product.platform})\n`;
    });
    prompt += '\n';
  }

  if (budget) {
    if (budget.min !== undefined && budget.max !== undefined) {
      prompt += `Budget range: ₱${budget.min} - ₱${budget.max}\n\n`;
    } else if (budget.max !== undefined) {
      prompt += `Budget: Up to ₱${budget.max}\n\n`;
    } else if (budget.min !== undefined) {
      prompt += `Budget: ₱${budget.min} and above\n\n`;
    }
  }

  if (category) {
    prompt += `Category of interest: ${category}\n\n`;
  }

  prompt += `Please provide:
1. A list of 3-5 personalized product recommendations
2. A list of 3-5 suggested search queries the user might be interested in
3. A brief explanation of why these recommendations were chosen
4. (Optional) Any trending items that might be relevant

Format your response as JSON with the following structure:
{
  "recommendations": ["recommendation1", "recommendation2", ...],
  "suggestedSearches": ["search1", "search2", ...],
  "explanation": "Brief explanation text",
  "trendingItems": ["trend1", "trend2", ...]
}`;

  return prompt;
}

/**
 * Parses the AI response into a structured format
 *
 * @param responseText The raw text response from the AI
 * @returns A structured recommendation response
 */
function parseRecommendationResponse(responseText: string): RecommendationResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      const data = JSON.parse(jsonStr);

      return {
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
        suggestedSearches: Array.isArray(data.suggestedSearches) ? data.suggestedSearches : [],
        explanation: data.explanation || '',
        trendingItems: Array.isArray(data.trendingItems) ? data.trendingItems : undefined
      };
    }

    throw new Error('Could not extract JSON from response');
  } catch (error) {
    console.error('[DeepSeekRecommendations] Error parsing AI response:', error);

    // Return fallback data
    return {
      recommendations: [
        'Explore trending summer dresses',
        'Check out new arrivals in footwear',
        'Browse sustainable fashion collections'
      ],
      suggestedSearches: [
        'casual outfits',
        'office wear',
        'summer fashion'
      ],
      explanation: 'Based on popular fashion trends for the current season.'
    };
  }
}
