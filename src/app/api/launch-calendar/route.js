import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request) {
  try {
    const { projectName, projectPain, signals, outreachMap, communities, targetAudience } = await request.json();

    if (!signals || signals.length < 3) {
      return NextResponse.json(
        { error: "Need at least 3 signals to generate calendar" },
        { status: 400 }
      );
    }

    // Analyze signals for feature ideas - keep it brief
    const signalContent = signals.slice(0, 8).map(s => 
      (s.content || '').slice(0, 100)
    ).join('\n- ');

    const wouldPayCount = signals.filter(s => outreachMap[s.id]?.status === 'would_pay').length;
    const topCommunities = communities.slice(0, 3).map(c => c.name).join(', ');

    const prompt = `Generate a 4-week startup launch calendar as JSON.

PROJECT: ${projectName}
PAIN: ${projectPain}
AUDIENCE: ${targetAudience || 'Founders'}
VALIDATED: ${wouldPayCount} "I'd pay" signals
COMMUNITIES: ${topCommunities}

USER SIGNALS:
- ${signalContent}

Return ONLY valid JSON (no markdown, no backticks):
{
  "mvpFeatures": [
    {"name": "Feature 1", "description": "Brief desc", "basedOn": "User signal"}
  ],
  "weeks": [
    {
      "week": 1,
      "theme": "Build Core MVP",
      "days": [
        {"day": 1, "dayOfWeek": "Monday", "task": "Task title", "description": "What to do", "category": "build", "timeEstimate": "2h"},
        {"day": 2, "dayOfWeek": "Tuesday", "task": "Task", "description": "Desc", "category": "market", "timeEstimate": "1h", "template": "Tweet template here"}
      ]
    }
  ],
  "summary": "One line summary"
}

Rules:
- 3-4 MVP features max
- 5-7 days per week (not all 7 required)
- Categories: build, market, outreach
- Include "template" field for market/outreach tasks
- Keep descriptions under 50 words
- Keep templates under 200 chars`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].text;
    
    let result;
    try {
      // Clean the response - remove any markdown formatting
      let cleanJson = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Find the JSON object
      const startIndex = cleanJson.indexOf('{');
      const endIndex = cleanJson.lastIndexOf('}');
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error("No JSON object found");
      }
      
      cleanJson = cleanJson.slice(startIndex, endIndex + 1);
      result = JSON.parse(cleanJson);
      
    } catch (parseError) {
      console.error("Failed to parse calendar:", parseError.message);
      console.error("Raw response:", responseText.slice(0, 500));
      
      // Return a fallback calendar
      result = generateFallbackCalendar(projectName, topCommunities);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Launch calendar API error:", error);
    return NextResponse.json(
      { error: "Failed to generate calendar" },
      { status: 500 }
    );
  }
}

function generateFallbackCalendar(projectName, communities) {
  return {
    mvpFeatures: [
      { name: "Core Feature", description: "The main value proposition", basedOn: "User feedback" },
      { name: "User Auth", description: "Sign up and login", basedOn: "Standard requirement" },
      { name: "Dashboard", description: "Main interface", basedOn: "Usability" }
    ],
    weeks: [
      {
        week: 1,
        theme: "Build Core MVP",
        days: [
          { day: 1, dayOfWeek: "Monday", task: "Set up project", description: "Initialize repo, set up framework", category: "build", timeEstimate: "2h" },
          { day: 2, dayOfWeek: "Tuesday", task: "Build core feature", description: "Implement the main functionality", category: "build", timeEstimate: "4h" },
          { day: 3, dayOfWeek: "Wednesday", task: "Tweet progress", description: "Share what you built", category: "market", timeEstimate: "30m", template: `Day 2 of building ${projectName}. Core feature done! 🚀` },
          { day: 4, dayOfWeek: "Thursday", task: "Add user auth", description: "Implement sign up/login", category: "build", timeEstimate: "3h" },
          { day: 5, dayOfWeek: "Friday", task: "Build dashboard", description: "Create the main UI", category: "build", timeEstimate: "4h" }
        ]
      },
      {
        week: 2,
        theme: "Polish & Test",
        days: [
          { day: 1, dayOfWeek: "Monday", task: "Bug fixes", description: "Fix issues from testing", category: "build", timeEstimate: "3h" },
          { day: 2, dayOfWeek: "Tuesday", task: "Tweet progress", description: "Share your progress", category: "market", timeEstimate: "30m", template: `Week 2 of ${projectName}. Almost ready for beta! 👀` },
          { day: 3, dayOfWeek: "Wednesday", task: "Add polish", description: "UI improvements", category: "build", timeEstimate: "3h" },
          { day: 4, dayOfWeek: "Thursday", task: "Deploy beta", description: "Ship to production", category: "build", timeEstimate: "2h" },
          { day: 5, dayOfWeek: "Friday", task: "DM 5 leads", description: "Reach out to interested people", category: "outreach", timeEstimate: "1h" }
        ]
      },
      {
        week: 3,
        theme: "Soft Launch",
        days: [
          { day: 1, dayOfWeek: "Monday", task: "DM warm leads", description: "Contact people who said they'd pay", category: "outreach", timeEstimate: "1h" },
          { day: 2, dayOfWeek: "Tuesday", task: `Post in r/${communities.split(',')[0] || 'startups'}`, description: "Share with your validated community", category: "market", timeEstimate: "1h" },
          { day: 3, dayOfWeek: "Wednesday", task: "Respond to feedback", description: "Engage with comments", category: "outreach", timeEstimate: "2h" },
          { day: 4, dayOfWeek: "Thursday", task: "Iterate on feedback", description: "Make quick improvements", category: "build", timeEstimate: "3h" },
          { day: 5, dayOfWeek: "Friday", task: "Tweet launch", description: "Announce soft launch", category: "market", timeEstimate: "30m", template: `${projectName} is live! Built this in 2 weeks after validating with real users. Link in bio 🔥` }
        ]
      },
      {
        week: 4,
        theme: "Public Launch",
        days: [
          { day: 1, dayOfWeek: "Monday", task: "Prep launch assets", description: "Screenshots, copy, links", category: "market", timeEstimate: "2h" },
          { day: 2, dayOfWeek: "Tuesday", task: "Launch on Twitter", description: "Full launch thread", category: "market", timeEstimate: "1h", template: `I built ${projectName} in 4 weeks. Here's the story 🧵` },
          { day: 3, dayOfWeek: "Wednesday", task: "Post on Reddit", description: "Share in relevant subs", category: "market", timeEstimate: "1h" },
          { day: 4, dayOfWeek: "Thursday", task: "Engage & respond", description: "Reply to all comments", category: "outreach", timeEstimate: "3h" },
          { day: 5, dayOfWeek: "Friday", task: "Review metrics", description: "Check signups, feedback", category: "build", timeEstimate: "1h" }
        ]
      }
    ],
    summary: `4-week plan to build and launch ${projectName} with validation baked in.`
  };
}