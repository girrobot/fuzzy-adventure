// This is a placeholder for a real grammar checking service
// In a production app, you would integrate with a service like Grammarly API, LanguageTool, etc.

export interface GrammarSuggestion {
  original: string;
  suggestion: string;
  reason: string;
}

export async function checkGrammar(text: string): Promise<GrammarSuggestion[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple demo checks
  const suggestions: GrammarSuggestion[] = [];
  
  // Check for double spaces
  const doubleSpaceRegex = /\s{2,}/g;
  let match;
  while ((match = doubleSpaceRegex.exec(text)) !== null) {
    suggestions.push({
      original: match[0],
      suggestion: ' ',
      reason: 'Multiple spaces detected. Consider using a single space.'
    });
  }
  
  // Check for common typos
  const typos: Record<string, string> = {
    'teh': 'the',
    'adn': 'and',
    'waht': 'what',
    'taht': 'that',
    'thier': 'their',
    'recieve': 'receive',
    'seperate': 'separate',
    'definately': 'definitely',
    'occured': 'occurred',
    'untill': 'until',
    'wierd': 'weird',
    'alot': 'a lot'
  };
  
  Object.entries(typos).forEach(([typo, correction]) => {
    const typoRegex = new RegExp(`\\b${typo}\\b`, 'gi');
    while ((match = typoRegex.exec(text)) !== null) {
      suggestions.push({
        original: match[0],
        suggestion: match[0].replace(new RegExp(typo, 'i'), correction),
        reason: `"${match[0]}" is a common misspelling of "${correction}".`
      });
    }
  });
  
  // Check for repeated words
  const repeatedWordRegex = /\b(\w+)\s+\1\b/gi;
  while ((match = repeatedWordRegex.exec(text)) !== null) {
    suggestions.push({
      original: match[0],
      suggestion: match[1],
      reason: 'Repeated word detected.'
    });
  }
  
  return suggestions;
} 