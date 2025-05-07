// src/app/actions.ts
'use server';

import { suggestSearchTerms, type SuggestSearchTermsInput, type SuggestSearchTermsOutput } from '@/ai/flows/suggest-search-terms';

export async function getAiSuggestions(input: SuggestSearchTermsInput): Promise<SuggestSearchTermsOutput> {
  try {
    const result = await suggestSearchTerms(input);
    return result;
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    // Return a default/empty response in case of error
    return { suggestions: [], filters: {} };
  }
}
