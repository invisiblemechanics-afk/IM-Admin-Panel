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

export async function generateSkillTag(req: AutoGenerationRequest): Promise<string> {
  const system = 'Suggest a short kebab-case skill tag from the provided question and available tags. Prefer one of the available tags; otherwise produce a concise new one.';
  const user = `Question: ${req.questionText}\nAvailable tags: ${(req.availableSkillTags || []).join(', ')}`;
  const result = await callOpenAI(system, user);
  return (result || 'general-concepts').split(/\s|\n/)[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
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

export async function generateAll(req: AutoGenerationRequest): Promise<{ skillTag: string; title: string; difficulty: number }> {
  const [skillTag, title, difficulty] = await Promise.all([
    generateSkillTag(req),
    generateTitle(req),
    generateDifficulty(req),
  ]);
  return { skillTag, title, difficulty };
}



