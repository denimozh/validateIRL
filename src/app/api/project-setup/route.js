import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request) {
  try {
    const { projectName, painDescription, targetAudience } = await request.json();

    if (!projectName || !painDescription) {
      return NextResponse.json(
        { error: "Project name and pain description required" },
        { status: 400 }
      );
    }

    const prompt = `You are helping a founder write an HONEST validation post. No fake stories, no made-up scenarios.

PROJECT: ${projectName}
PAIN POINT: ${painDescription}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}

Generate:
1. 3-5 Reddit subreddits where this audience hangs out
2. An HONEST Reddit validation post
3. A Twitter/X validation post
4. 3 search queries to find people with this pain

CRITICAL FOR REDDIT POST:
- Be HONEST - say you're validating an idea
- Share why you care about this problem (briefly)
- Describe the solution concept clearly with bullet points
- Ask directly: "Would this help you? Would you use it?"
- End with "Not selling anything - just validating before I build"
- Keep it conversational and genuine
- 150-250 words max

GOOD EXAMPLE:
"Hey everyone - I'm validating an idea before building it (learned this lesson the hard way after shipping a project with 0 users 😅)

Here's what I'm thinking:
• [Feature 1]
• [Feature 2]  
• [Feature 3]

Basically [one sentence summary of the value prop].

My question: Would something like this have helped you? Would you actually use it?

Not selling anything - just trying to validate before I write code. Appreciate any honest feedback!"

BAD EXAMPLE (don't do this):
"Lost $347 because [made up sob story]. Please tell me someone has figured this out." 
(This is dishonest and manipulative)

FOR TWITTER:
- Be direct: "Validating an idea: [concept]. Would you use this?"
- Or share the problem you're solving and ask for feedback
- Under 280 characters

Respond ONLY with valid JSON:
{
  "subreddits": [
    { "name": "subredditname", "reason": "Why this community is relevant" }
  ],
  "redditPost": {
    "title": "Honest, direct title about validating an idea",
    "body": "Genuine post asking for feedback"
  },
  "twitterPost": "Direct tweet about validating",
  "searchQueries": ["query 1", "query 2", "query 3"]
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].text;
    
    let result;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Project setup API error:", error);
    return NextResponse.json(
      { error: "Failed to generate setup" },
      { status: 500 }
    );
  }
}