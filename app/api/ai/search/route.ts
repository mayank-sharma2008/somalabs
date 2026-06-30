import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { webSearch } from "@/lib/search/tavily";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // 1. Get live search results
    const searchData = await webSearch(query, { maxResults: 6 });

    if (searchData.results.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any current sources for that query.",
        sources: [],
      });
    }

    // 2. Build a numbered source list for the model to cite
    const sourceBlock = searchData.results
      .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
      .join("\n\n");

    const systemPrompt = `You are SOMA's search assistant. Answer the user's question using ONLY the numbered sources below. 

Rules:
- Cite sources inline using [1], [2], etc. matching the source numbers.
- Every factual claim must have a citation.
- If sources conflict, note the discrepancy.
- If the sources don't fully answer the question, say so clearly.
- Do not use information outside the provided sources.
- Be concise and direct.

SOURCES:
${sourceBlock}`;

    // 3. Synthesize with Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      answer,
      sources: searchData.results.map((r, i) => ({
        index: i + 1,
        title: r.title,
        url: r.url,
        snippet: r.content.slice(0, 180),
      })),
    });
  } catch (err: any) {
    console.error("Search route error:", err);
    return NextResponse.json(
      { error: err.message || "Search failed" },
      { status: 500 }
    );
  }
}