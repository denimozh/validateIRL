import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { query, numResults = 10 } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      return NextResponse.json(
        { error: "Search not configured" },
        { status: 500 }
      );
    }

    // Search Reddit via Google Custom Search
    // Add date filter for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateRestrict = "d30"; // Last 30 days

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(
      query
    )}&num=${Math.min(numResults, 10)}&dateRestrict=${dateRestrict}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.error) {
      console.error("Google Search API error:", data.error);
      return NextResponse.json(
        { error: data.error.message || "Search failed" },
        { status: 500 }
      );
    }

    // Parse results into our format
    const results = (data.items || []).map((item) => {
      // Extract subreddit from URL
      const subredditMatch = item.link.match(/reddit\.com\/r\/(\w+)/);
      const subreddit = subredditMatch ? subredditMatch[1] : "";

      // Extract author from snippet if possible
      const authorMatch = item.snippet?.match(/by\s+u\/(\w+)|posted\s+by\s+(\w+)/i);
      const author = authorMatch ? (authorMatch[1] || authorMatch[2]) : "unknown";

      return {
        title: item.title?.replace(" : " + subreddit, "").replace(" - Reddit", "") || "",
        snippet: item.snippet || "",
        url: item.link,
        subreddit,
        author,
        source: "google",
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}