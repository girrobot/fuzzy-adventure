/**
 * Calculate readability metrics for text
 * Implements the Flesch-Kincaid readability tests
 */

export interface ReadabilityScore {
  score: number;
  grade: number;
  level: string;
  description: string;
}

export function calculateReadability(text: string): ReadabilityScore {
  // If text is empty, return default values
  if (!text || !text.trim()) {
    return {
      score: 0,
      grade: 0,
      level: 'N/A',
      description: 'Add some text to see readability score'
    };
  }

  // Count sentences, words, and syllables
  const sentences = countSentences(text);
  const words = countWords(text);
  const syllables = countSyllables(text);
  
  // Avoid division by zero
  if (words === 0 || sentences === 0) {
    return {
      score: 0,
      grade: 0,
      level: 'N/A',
      description: 'Not enough text to analyze'
    };
  }
  
  // Calculate Flesch Reading Ease score
  // Formula: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const score = Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words));
  
  // Calculate Flesch-Kincaid Grade Level
  // Formula: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const grade = Math.round((0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59) * 10) / 10;
  
  // Determine readability level
  let level = '';
  let description = '';
  
  if (score >= 90) {
    level = 'Very Easy';
    description = '5th-grade level. Very easy to read.';
  } else if (score >= 80) {
    level = 'Easy';
    description = '6th-grade level. Easy to read.';
  } else if (score >= 70) {
    level = 'Fairly Easy';
    description = '7th-grade level. Fairly easy to read.';
  } else if (score >= 60) {
    level = 'Standard';
    description = '8th & 9th-grade level. Plain English.';
  } else if (score >= 50) {
    level = 'Fairly Difficult';
    description = '10th to 12th-grade level. Fairly difficult to read.';
  } else if (score >= 30) {
    level = 'Difficult';
    description = 'College level. Difficult to read.';
  } else {
    level = 'Very Difficult';
    description = 'College graduate level. Very difficult to read.';
  }
  
  return {
    score: Math.max(0, Math.min(100, score)), // Clamp between 0-100
    grade,
    level,
    description
  };
}

// Count the number of sentences in text
function countSentences(text: string): number {
  // Split on periods, exclamation points, question marks, followed by space or end of string
  const matches = text.match(/[.!?]+(\s|$)/g);
  return matches ? matches.length : 1; // At least 1 sentence
}

// Count the number of words in text
function countWords(text: string): number {
  const words = text.trim().split(/\s+/);
  return words.length > 0 && words[0] !== '' ? words.length : 0;
}

// Count the number of syllables in text
function countSyllables(text: string): number {
  // Remove non-alphabetic characters
  const cleanText = text.toLowerCase().replace(/[^a-z]/g, ' ');
  const words = cleanText.split(/\s+/).filter(word => word.length > 0);
  
  let totalSyllables = 0;
  
  for (const word of words) {
    totalSyllables += countWordSyllables(word);
  }
  
  return totalSyllables;
}

// Count syllables in a single word
function countWordSyllables(word: string): number {
  // Special case for empty strings or very short words
  if (!word || word.length <= 3) {
    return 1;
  }
  
  // Remove trailing e, es, ed
  word = word.replace(/(?:[es]{1,2}|ed)$/, '');
  
  // Count vowel groups as syllables
  const vowelGroups = word.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;
  
  // Adjust for special cases
  if (word.length > 3 && word.endsWith('le') && !'aeiouy'.includes(word.charAt(word.length - 3))) {
    count++;
  }
  
  return Math.max(1, count); // Every word has at least one syllable
} 