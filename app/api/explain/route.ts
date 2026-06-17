import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

export async function POST(request: Request) {
  const { code, prompt } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `A beginner just used an AI app builder to generate a web app.

Their request was: "${prompt}"

Here is the generated HTML/React code:
${code.slice(0, 5000)}

Create a friendly learning experience for a beginner who has never coded. Identify 4-5 key concepts from this specific code.

For each concept return:
- title: catchy 3-5 word title
- emoji: one relevant emoji
- concept: one plain-English sentence — what IS this concept (no jargon)
- explanation: 2-3 sentences about how it shows up in THEIR specific app
- codeHint: copy 1-2 lines max from the actual code that best illustrates this concept
- takeaway: one short encouraging sentence about what they just learned

Return ONLY valid JSON, no markdown, no explanation outside the JSON:
{
  "sections": [
    {
      "title": "...",
      "emoji": "...",
      "concept": "...",
      "explanation": "...",
      "codeHint": "...",
      "takeaway": "..."
    }
  ]
}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const data = JSON.parse(match[0]);
    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to parse lesson" }, { status: 500 });
  }
}
