const API_KEY = process.env.NEXT_PUBLIC_TEXTGEARS_API_KEY;

export async function checkGrammar(text: string) {
  try {
    const response = await fetch(
      `https://api.textgears.com/check.php?text=${encodeURIComponent(text)}&key=${API_KEY}`
    );
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Grammar check failed');
    }
    
    return data.errors.map((error: any) => ({
      original: error.bad,
      suggestion: error.better[0] || '',
      reason: error.type,
      offset: error.offset,
      length: error.length
    }));
  } catch (error) {
    console.error('Grammar check error:', error);
    throw error;
  }
} 