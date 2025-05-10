/**
 * Test script for Google Image Scraper API from Apify
 * This script tests the API with a sample product name
 */

const axios = require('axios');

// Your Apify API token
const APIFY_API_TOKEN = 'apify_api_00LR4EhrbmundyHwjPebjYB3h4uOa748vvqv';

/**
 * Fetches images from Google Images using Apify API
 * @param {string} query - The search query
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Promise<Array>} - Array of image results
 */
async function fetchGoogleImages(query, maxResults = 5) {
  try {
    console.log(`Fetching Google Images for query: "${query}"`);

    // Prepare the request payload
    const payload = {
      "queries": [query],
      "maxImagesPerQuery": maxResults,
      "includeUnrelatedResults": false
    };

    // Make the API request to start the actor
    const runResponse = await axios.post(
      'https://api.apify.com/v2/acts/tnudF2IxzORPhg4r8/runs?token=' + APIFY_API_TOKEN,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Get the run ID
    const runId = runResponse.data.data.id;
    console.log(`Actor run started with ID: ${runId}`);

    // Wait for the run to finish (poll the status)
    let isFinished = false;
    let statusResponse;

    while (!isFinished) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks

      statusResponse = await axios.get(
        `https://api.apify.com/v2/acts/tnudF2IxzORPhg4r8/runs/${runId}?token=${APIFY_API_TOKEN}`
      );

      const status = statusResponse.data.data.status;
      console.log(`Current status: ${status}`);

      if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'TIMED-OUT' || status === 'ABORTED') {
        isFinished = true;
      }
    }

    if (statusResponse.data.data.status !== 'SUCCEEDED') {
      throw new Error(`Actor run failed with status: ${statusResponse.data.data.status}`);
    }

    // Get the results
    const resultsResponse = await axios.get(
      `https://api.apify.com/v2/acts/tnudF2IxzORPhg4r8/runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`
    );

    const results = resultsResponse.data;
    console.log(`Retrieved ${results.length} images for query "${query}"`);

    // Format the results to return just the image URLs and metadata
    const formattedResults = results.map(item => ({
      url: item.imageUrl || item.url,
      title: item.title || '',
      source: item.sourceUrl || item.source || ''
    }));

    return formattedResults;
  } catch (error) {
    console.error('Error fetching Google Images:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

// Test the function with a sample product
async function runTest() {
  // Test with a few different product names
  const testQueries = [
    'KimZoo Student casual Sneakers Sports Training Shoes',
    'YZBZCJ Girl\'s Cartoon Kuromi Shoes Spring Autumn Children\'s Sports Shoes',
    'Unisex running shoes comfortable men women sneakers'
  ];

  for (const query of testQueries) {
    console.log(`\n--- Testing with query: "${query}" ---`);
    const results = await fetchGoogleImages(query);

    if (results.length > 0) {
      console.log('Results:');
      results.forEach((result, index) => {
        console.log(`[${index + 1}] ${result.title}`);
        console.log(`    URL: ${result.url}`);
        console.log(`    Source: ${result.source}`);
      });
    } else {
      console.log('No results found.');
    }
  }
}

// Run the test
runTest().catch(console.error);
