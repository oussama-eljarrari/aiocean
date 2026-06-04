import { webSearch } from '@exalabs/ai-sdk';
import { config } from '../../config';

// We export the ready-made tool from Exa's AI SDK.
export const webSearchTool = webSearch({
  apiKey: config.exaApiKey,
});
