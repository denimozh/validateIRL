import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request) {
  try {
    const { projectName, projectPain, signals } = await request.json();

    if (!signals || signals.length < 3) {
      return NextResponse.json(
        { error: "Need at least 3 signals" },
        { status: 400 }
      );
    }

    // Prepare signal summaries
    const signalSummaries = signals
      .map(
        (s, i) =>
          `Signal ${i + 1} (${s.intentScore} intent, r/${s.subreddit}):
Content: ${s.content?.slice(0, 500) || "No content"}
${s.notes ? `Notes: ${s.notes}` : ""}
Status: ${s.status}`
      )
      .join("\n\n");

    const prompt = `You are helping a founder validate and refine their startup idea based on real user signals they've collected.
    You have to be 100% honest.

Project: ${projectName}
Original Pain Point: ${projectPain || "Not specified"}

Here are ${signals.length} signals (real posts/conversations) they've collected:

${signalSummaries}

Based on these signals, provide insights in the following JSON format:
{
  "painPoints": ["3-5 common pain points you see across these signals"],
  "features": ["4-6 specific feature suggestions based on what users are asking for"],
  "pivots": ["2-3 potential pivot ideas or adjustments to consider"],
  "keywords": ["8-12 keywords/phrases that keep appearing"],
  "refinedIdea": "A 2-3 sentence refined version of their idea that better matches what users actually want",
  "communities": ["list of subreddits from the signals, deduplicated"]
}

Be specific and actionable. Reference actual things from the signals. Don't be generic.
Return ONLY valid JSON, no markdown or explanation.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text content
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON from response
    let insights;
    try {
      // Try to extract JSON if wrapped in anything
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      insights = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch {
      console.error("Failed to parse insights JSON:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}