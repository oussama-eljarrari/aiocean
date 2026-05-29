import { webSearch } from '@exalabs/ai-sdk';

// We export the ready-made tool from Exa's AI SDK.
// Ensure EXA_API_KEY is set in the environment for this to work natively.
export const webSearchTool = webSearch({
  apiKey: process.env.EXA_API_KEY,
  // You can pass default params here if needed by Exa's SDK, 
  // but usually it picks up EXA_API_KEY from env.
});
