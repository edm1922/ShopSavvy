// This is a server-side file
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant search terms and filters
 * based on an initial query.
 *
 * - suggestSearchTerms - The main function to call to get search term suggestions.
 * - SuggestSearchTermsInput - The input type for the suggestSearchTerms function.
 * - SuggestSearchTermsOutput - The output type for the suggestSearchTerms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSearchTermsInputSchema = z.object({
  query: z.string().describe('The user\u0027s initial search query.'),
});
export type SuggestSearchTermsInput = z.infer<typeof SuggestSearchTermsInputSchema>;

const SuggestSearchTermsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested search terms based on the input query.'),
  filters:
    z.object({
      category: z.string().optional().describe('Suggested category filter.'),
      minPrice: z.number().optional().describe('Suggested minimum price filter.'),
      maxPrice: z.number().optional().describe('Suggested maximum price filter.'),
      brand: z.string().optional().describe('Suggested brand filter.'),
    })
    .optional()
    .describe('Suggested filters to refine the search.'),
});

export type SuggestSearchTermsOutput = z.infer<typeof SuggestSearchTermsOutputSchema>;

export async function suggestSearchTerms(input: SuggestSearchTermsInput): Promise<SuggestSearchTermsOutput> {
  return suggestSearchTermsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSearchTermsPrompt',
  input: {schema: SuggestSearchTermsInputSchema},
  output: {schema: SuggestSearchTermsOutputSchema},
  prompt: `You are a shopping assistant AI. A user has entered the following search query: "{{query}}".

  Suggest three alternative search terms that the user might be interested in, and suggest filters that the user might want to apply, given their search query.

  Respond in JSON format.`,
});

const suggestSearchTermsFlow = ai.defineFlow(
  {
    name: 'suggestSearchTermsFlow',
    inputSchema: SuggestSearchTermsInputSchema,
    outputSchema: SuggestSearchTermsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
