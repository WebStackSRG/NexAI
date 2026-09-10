import { getGenAIClient } from "./gemini.service.js";

/**
 * Creative Writing Assistant Service
 * Supports multi-chapter narrative continuation, character generation, and world-building notes.
 */

export const continueChapter = async ({
  title = "Untitled Saga",
  genre = "sci-fi",
  tone = "dark",
  style = "descriptive",
  chapterNumber = 1,
  characters = [],
  worldNotes = "",
  previousContext = "",
  instruction = "Advance the main conflict with high tension and character dialogue.",
}) => {
  const ai = getGenAIClient();

  if (!ai) {
    // Dev fallback simulation
    return {
      heading: `Chapter ${chapterNumber}: The Turning Point`,
      body: `<p>The shadows stretched long across the skyline of ${title}. ${characters[0]?.name || "The protagonist"} paused, gripping their weapon as the cold wind whistled through the ruins.</p><p>"We cannot turn back now," they muttered, glancing at the ancient insignia etched into the stone.</p><p>Genre: ${genre} | Tone: ${tone} | Style: ${style}</p>`,
    };
  }

  try {
    const charactersSummary = characters.length > 0
      ? characters.map(c => `- ${c.name} (${c.role || "Character"}): ${c.description || ""}`).join("\n")
      : "None specified";

    const prompt = `You are an award-winning creative writing author and novelist.
Write the next chapter for a story titled "${title}".

Parameters:
- Genre: ${genre}
- Tone: ${tone}
- Writing Style: ${style}
- Chapter Number: ${chapterNumber}
- Characters in Story:
${charactersSummary}
- World-Building & Lore Notes:
${worldNotes || "Standard setting for the genre."}
- Previous Chapter Recap / Narrative Context:
${previousContext.slice(0, 3000) || "Beginning of the narrative arc."}
- Director / Author Instruction for this chapter:
${instruction}

Requirements:
1. Provide a compelling chapter heading (e.g. "Chapter ${chapterNumber}: Title").
2. Write rich, immersive prose formatted in clean HTML paragraphs (<p>...</p>, <em>...</em>, <strong>...</strong>, <blockquote>...</blockquote>).
3. Do NOT wrap output in markdown code blocks.
4. Output valid JSON in this exact structure:
{
  "heading": "Chapter ${chapterNumber}: The Resonant Void",
  "body": "<p>...</p><p>...</p>"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text.trim());
    return {
      heading: parsed.heading || `Chapter ${chapterNumber}`,
      body: parsed.body || "<p>The story continues...</p>",
    };
  } catch (err) {
    console.warn("[CreativeWritingService] Error:", err.message);
    return {
      heading: `Chapter ${chapterNumber}: New Horizon`,
      body: `<p>The night settled into an uneasy silence. ${characters[0]?.name || "The traveler"} watched the horizon, knowing that whatever came next would reshape their destiny forever.</p>`,
    };
  }
};
