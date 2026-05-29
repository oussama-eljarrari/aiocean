import { tool } from 'ai';
import z from 'zod';

export const fetchPageTool = tool({
  description: 'Fetch the text content and highlights of a specific URL. Best for reading the tool\'s official website or documentation.',
  inputSchema: z.object({
    url: z.string().describe('The absolute URL to fetch (e.g. https://example.com)'),
  }),
  execute: async ({ url }) => {
    const EXA_API_KEY = process.env.EXA_API_KEY;
    if (!EXA_API_KEY) {
      console.warn("EXA_API_KEY is not set. Returning placeholder.");
      return { url, error: "Configuration Error: EXA_API_KEY is missing." };
    }

    try {
      const response = await fetch("https://api.exa.ai/contents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": EXA_API_KEY
        },
        body: JSON.stringify({
          urls: [url],
          text: { maxCharacters: 15000 },
          highlights: true,
          livecrawlTimeout: 10000
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return { url, error: `Exa API error: ${response.status} - ${errText}` };
      }

      const data = await response.json();
      
      // Handle Exa's per-URL status checks
      const status = data.statuses?.find((s: any) => s.id === url);
      if (status && status.status === "error") {
        return { url, error: `Crawl failed: ${status.error?.tag}` };
      }

      const result = data.results?.[0];
      if (!result) {
        return { url, error: "No content extracted." };
      }

      return {
        url,
        title: result.title,
        description: result.text?.substring(0, 10000), // Truncate to save context window
        highlights: result.highlights
      };
    } catch (error: any) {
      return { url, error: error.message };
    }
  },
});
