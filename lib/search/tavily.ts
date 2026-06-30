export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  query: string;
  results: SearchResult[];
}

export async function webSearch(
  query: string,
  options: { maxResults?: number; searchDepth?: "basic" | "advanced" } = {}
): Promise<TavilySearchResponse> {
  const { maxResults = 5, searchDepth = "basic" } = options;

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set in environment variables");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: searchDepth,
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Tavily search failed: ${response.status} ${errText}`);
  }

  const data = await response.json();

  return {
    query: data.query,
    results: (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })),
  };
}