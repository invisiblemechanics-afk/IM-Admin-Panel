/*
  Lightweight wrapper around OpenAI. Provides safe fallbacks when no API key is
  configured so the rest of the admin UI remains functional without breaking
  other parts of the website.
*/

export type AutoGenerationRequest = {
  questionText: string;
  chapter?: string;
  availableSkillTags?: string[];
  questionType?: 'MCQ' | 'MultipleAnswer' | 'Numerical';
  exam?: 'JEE Main' | 'JEE Advanced' | 'NEET';
};

const hasKey = Boolean(import.meta.env.VITE_OPENAI_API_KEY);
const endpoint = 'https://api.openai.com/v1/chat/completions';

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function prefilterTags(question: string, tags: string[], k = 80) {
  const q = normalize(question).split(/\s+/).filter(w => w.length > 2);
  const scores = tags.map(t => {
    const tt = normalize(t).split(/\s+/);
    const overlap = tt.filter(w => q.includes(w)).length;
    return { t, score: overlap + (t.includes('-') ? 0.2 : 0) }; // tiny bias for hyphenated slugs
  });
  scores.sort((a, b) => b.score - a.score);
  const shortlist = scores.slice(0, Math.min(k, scores.length)).map(s => s.t);
  // ensure uniqueness
  return Array.from(new Set(shortlist));
}

function extractJsonArray(text: string): string[] {
  try {
    const obj = JSON.parse(text);
    const arr = Array.isArray(obj.skillTags) ? obj.skillTags : Array.isArray(obj.tags) ? obj.tags : [];
    return arr.map(String);
  } catch {
    // try to extract from code fence
    const m = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const obj = JSON.parse(m[1] ?? m[0]);
        const arr = Array.isArray(obj.skillTags) ? obj.skillTags : Array.isArray(obj.tags) ? obj.tags : [];
        return arr.map(String);
      } catch {}
    }
  }
  return [];
}

async function callOpenAI(system: string, user: string): Promise<string> {
  if (!hasKey) {
    // Safe fallback when API key is not configured
    return '';
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim?.() ?? '';
}

export async function refineLatexContent(
  content: string,
  contentType: 'theory' | 'question'
): Promise<string> {
  const system = 'You are a helpful assistant that formats and slightly improves LaTeX math content without changing the meaning. Return only the refined content.';
  const user = `Content type: ${contentType}. Refine the LaTeX and clean formatting.\n\n${content}`;
  const result = await callOpenAI(system, user);
  return result || content;
}

export async function generateSkillTags(questionText: string, allAvailableTags: string[], maxTags = 5): Promise<string[]> {
  if (!hasKey) {
    // Safe fallback when API key is not configured
    return [];
  }

  const shortlist = prefilterTags(questionText, allAvailableTags, 80);

  const system = `You are a precise tagger for JEE/NEET Physics/Math questions.
Choose ONLY from the provided list of skill tags (slugs). Return 1 to ${maxTags} tags that best match.
If nothing matches well, return an empty array. Output strict JSON.`;

  const userPayload = {
    question: questionText,
    availableTags: shortlist, // keep short
    rules: {
      pickOnlyFromList: true,
      maxTags,
      returnJson: { skillTags: ["tag1", "tag2"] }
    }
  };

  // use your existing OpenAI client code/model
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(userPayload) }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content ?? '';
  const picked = extractJsonArray(text);

  // keep only items from the ORIGINAL allAvailableTags, de-dupe, clamp to maxTags
  const set = new Set(allAvailableTags);
  const filtered = picked.filter(t => set.has(t));
  return Array.from(new Set(filtered)).slice(0, maxTags);
}

// Backward-compatible wrapper (keep existing callers happy)
export async function generateSkillTag(req: AutoGenerationRequest): Promise<string> {
  const tags = await generateSkillTags(req.questionText, req.availableSkillTags || [], 1);
  return tags.length > 0 ? tags[0] : 'general-concepts';
}

export async function generateTitle(req: AutoGenerationRequest): Promise<string> {
  const system = 'Generate a concise, descriptive title (max 8 words). Return just the title.';
  const user = `Question: ${req.questionText}`;
  const result = await callOpenAI(system, user);
  return result || 'Untitled Question';
}

export async function generateDifficulty(req: AutoGenerationRequest): Promise<number> {
  const system = 'Estimate difficulty on a scale of 1-10 based on question complexity. Return just a number.';
  const user = `Question: ${req.questionText}`;
  const result = await callOpenAI(system, user);
  const parsed = parseInt(result || '5', 10);
  if (Number.isNaN(parsed)) return 5;
  return Math.min(10, Math.max(1, parsed));
}

export async function generateAll(req: AutoGenerationRequest): Promise<{ skillTag: string; skillTags: string[]; title: string; difficulty: number }> {
  const [skillTags, title, difficulty] = await Promise.all([
    generateSkillTags(req.questionText, req.availableSkillTags || [], 5),
    generateTitle(req),
    generateDifficulty(req),
  ]);
  return { 
    skillTag: skillTags.length > 0 ? skillTags[0] : 'general-concepts', 
    skillTags, 
    title, 
    difficulty 
  };
}



