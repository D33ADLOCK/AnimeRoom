// ─── LLM Call 1: Character Bundle Prompt ─────────────────────────────────────

export const getCharacterBundlePrompt = (userPrompt: string) =>
  `
Generate a roast-battle character bundle JSON object for the scenario below.

SCENARIO:
${userPrompt}

HARD REQUIREMENTS:
- Output MUST be a single valid JSON object only.
- No markdown, no code fences, no explanations, no extra text.
- Output MUST match the schema exactly.
- The root object has one key: "characters"
- "characters" is an array of exactly 2 objects.

CHARACTER ARRAY RULES:
- First item must have slot: "character1"
- Second item must have slot: "character2"
- Each item MUST include:
  - slot
  - name
  - title
  - stats (exactly 5)
  - skills (exactly 2)
  - imagePrompt (exactly 1, for the side-angle stats card)

STATS RULES:
- Use funny and character-relevant labels.
- Values must be integers from 0 to 100.
- Color must be a hex string like "#FF3D00".

SKILLS RULES:
- Each skill must include:
  - name
  - letter (1-2 chars, initial or abbreviation)
  - color (hex string like "#38BDF8")
  - desc (short funny description)
- Keep the skill funny, short, and relevant.

IMAGE PROMPT RULES:
- Generate exactly 1 prompt per character for a side-angle stats card shot.
- Prompt must describe only the character, not the background.
- Prompt must be concise but detailed enough for image generation.
- DEFAULT STYLE: unless the user explicitly requests another style, describe the character in cute / chibi form.
- IMPORTANT: characters must always be fully clothed, properly dressed, and safe for work.
- Do not describe revealing, sexualized, nude, transparent, torn, or inappropriate clothing.
- Clothing should match the character, anime vibe, and scenario.
- Include pose, expression, and clothing details.
- Include: "strictly match the art style of the reference image".

ONLY RETURN THE JSON Array.
`.trim();

// ─── LLM Call 2: Rounds Bundle Prompt ────────────────────────────────────────

export const getRoundsPrompt = (userPrompt: string) =>
  `
Generate a roast-battle rounds JSON array for the scenario below.

SCENARIO:
${userPrompt}

HARD REQUIREMENTS:
- Output MUST be a valid JSON array only.
- No markdown, no code fences, no explanations, no extra text.
- Output MUST match the schema exactly.
- The array must contain exactly 6 round objects.

ROUND RULES:
- Each round must include:
  - attacker ("character1" or "character2")
  - dialogue
  - damage
  - attackerImagePrompt
  - opponentImagePrompt

DIALOGUE RULES:
- Keep each dialogue short: one sentence.
- Dialogue should be savage, funny, and relevant to the opponent.
- Make the back-and-forth feel like a real roast battle.
- Keep it PG-13.
- No slurs, hate speech, explicit sexual content, or extreme vulgarity.

DAMAGE RULES:
- Integer from 1 to 100.
- Higher damage should feel more savage.
- Across all rounds, make the battle feel balanced and entertaining.

ATTACKER IMAGE PROMPT RULES:
- Describes the ATTACKER's front-facing dynamic pose in this round.
- Should match the energy of their dialogue (aggressive, smug, laughing, etc).
- DEFAULT STYLE: cute / chibi anime form unless specified otherwise.
- IMPORTANT: characters must always be fully clothed, properly dressed, and safe for work.
- Include pose, expression, and clothing details.
- Include: "strictly match the art style of the reference image".

OPPONENT IMAGE PROMPT RULES:
- Describes the OPPONENT's side profile reaction shot in this round.
- Should show the opponent reacting to the roast (shocked, angry, embarrassed, etc).
- DEFAULT STYLE: cute / chibi anime form unless specified otherwise.
- IMPORTANT: characters must always be fully clothed, properly dressed, and safe for work.
- Include pose, expression, and clothing details.

FLOW RULES:
- The 6 rounds should feel like a sequence, not random disconnected lines.
- Alternate momentum naturally.
- Make both characters feel strong and distinct.

ONLY RETURN THE JSON ARRAY.
`.trim();

// ─── LLM Call 3: Metadata Prompt ─────────────────────────────────────────────

export const getMetadataPrompt = (userPrompt: string) =>
  `
Generate a roast-battle metadata JSON object for the scenario below.

SCENARIO:
${userPrompt}

HARD REQUIREMENTS:
- Output MUST be a single valid JSON object only.
- No markdown, no code fences, no explanations, no extra text.
- Output MUST match the schema exactly.
- The root object has exactly 3 keys: battleTitle, shortSubtitle, thumbnailPrompt

BATTLE TITLE RULES:
- Short, catchy, dramatic, and funny.
- Make it feel like a versus video title.
- Keep it concise.

SHORT SUBTITLE RULES:
- One short hook line.
- Should feel punchy and fun.

THUMBNAIL PROMPT RULES:
- Must depict BOTH characters together in a dramatic versus pose.
- IMPORTANT: both characters must be fully clothed, properly dressed, and safe for work.
- No nudity, no revealing outfits, no inappropriate clothing.
- Keep it punchy and visual.

ONLY RETURN THE JSON OBJECT.
`.trim();
