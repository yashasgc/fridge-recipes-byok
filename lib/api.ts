import { ApiConfig, InferenceResult, UserPreferences } from '../types';

const PROMPT_TEXT = `You are a chef who plans practical meals from a fridge or pantry photo.

Tasks:
1) Identify recognizable ingredients with best-guess quantities and freshness notes (e.g., "bell pepper (2, slightly wrinkled)").
2) Propose 3–5 recipes that can be cooked with primarily the detected items. Respect the user's dietary preferences and available kitchen tools if provided.
3) Each recipe must include:
   - title
   - ingredients_used[]  (subset of detected)
   - missing_items[]     (fewest + cheapest substitutes)
   - steps[]             (5–10 concise steps)
   - estimated_time_min  (integer)
   - difficulty          ("easy" | "medium" | "hard")
   - notes               (assumptions, safety, substitutions)

Return STRICT JSON with no extra commentary using this schema:
{
  "detected_items": [ "string" ],
  "recipes": [
    {
      "title": "string",
      "ingredients_used": [ "string" ],
      "missing_items": [ "string" ],
      "steps": [ "string" ],
      "estimated_time_min": 0,
      "difficulty": "easy",
      "notes": "string"
    }
  ]
}`;

export async function getRecipesFromImage(
  base64Image: string,
  config: ApiConfig,
  preferences: UserPreferences
): Promise<InferenceResult> {
  const { apiKey, baseUrl, model } = config;
  
  // Build preferences text
  let preferencesText = PROMPT_TEXT;
  
  if (preferences.dietaryPreferences.length > 0) {
    preferencesText += `\n\nDietary preferences: ${preferences.dietaryPreferences.join(', ')}`;
  }
  
  if (preferences.dislikes.length > 0) {
    preferencesText += `\n\nDislikes: ${preferences.dislikes.join(', ')}`;
  }
  
  if (preferences.availableTools.length > 0) {
    preferencesText += `\n\nAvailable kitchen tools: ${preferences.availableTools.join(', ')}`;
  }

  const messages = [
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: preferencesText },
        { 
          type: "image_url" as const, 
          image_url: { 
            url: `data:image/jpeg;base64,${base64Image}` 
          } 
        }
      ]
    }
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.5,
      response_format: { type: "json_object" },
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from API');
  }

  try {
    return JSON.parse(content);
  } catch (parseError) {
    // Try to extract JSON from the response if it's not pure JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (secondParseError) {
        throw new Error(`Failed to parse JSON response: ${secondParseError}`);
      }
    }
    throw new Error(`Invalid JSON response: ${parseError}`);
  }
} 