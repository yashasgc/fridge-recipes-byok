import * as Clipboard from 'expo-clipboard';
import { Recipe } from '../types';

export async function copyRecipeToClipboard(recipe: Recipe): Promise<void> {
  const markdown = recipeToMarkdown(recipe);
  await Clipboard.setStringAsync(markdown);
}

function recipeToMarkdown(recipe: Recipe): string {
  let markdown = `# ${recipe.title}\n\n`;
  
  // Time and difficulty
  markdown += `**Time:** ${recipe.estimated_time_min} minutes | **Difficulty:** ${recipe.difficulty}\n\n`;
  
  // Ingredients used
  if (recipe.ingredients_used.length > 0) {
    markdown += `## Ingredients Used\n`;
    recipe.ingredients_used.forEach(ingredient => {
      markdown += `- ${ingredient}\n`;
    });
    markdown += '\n';
  }
  
  // Missing items
  if (recipe.missing_items.length > 0) {
    markdown += `## Missing Items\n`;
    recipe.missing_items.forEach(item => {
      markdown += `- ${item}\n`;
    });
    markdown += '\n';
  }
  
  // Steps
  markdown += `## Instructions\n`;
  recipe.steps.forEach((step, index) => {
    markdown += `${index + 1}. ${step}\n`;
  });
  markdown += '\n';
  
  // Notes
  if (recipe.notes) {
    markdown += `## Notes\n${recipe.notes}\n`;
  }
  
  return markdown;
}

export async function copyShoppingListToClipboard(missingItems: string[]): Promise<void> {
  const markdown = `# Shopping List\n\n${missingItems.map(item => `- [ ] ${item}`).join('\n')}`;
  await Clipboard.setStringAsync(markdown);
} 