function stripHtml(html) {
  if (!html) return '';
  
  return html
    // Convert common HTML entities
    .replace(/&quot;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    // Convert headings
    .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (match, level, text) => {
      const hashes = '#'.repeat(parseInt(level) + 1); // +1 since we already have # for title
      return `\n\n${hashes} ${text.trim()}\n\n`;
    })
    // Convert paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert links
    .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Convert strong/bold
    .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
    // Convert emphasis/italic
    .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
    // Convert lists
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (error) {
    return dateString;
  }
}

function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9-_]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function estimateTokens(text) {
  // Rough estimation: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

function chunkText(text, minTokens = 100, maxTokens = 400) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
    const tokenCount = estimateTokens(testChunk);
    
    if (tokenCount <= maxTokens) {
      currentChunk = testChunk;
    } else {
      // If current chunk meets minimum, save it
      if (estimateTokens(currentChunk) >= minTokens) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        // If too small, try to add more or split large sentence
        if (estimateTokens(sentence) > maxTokens) {
          // Split large sentence by words
          const words = sentence.split(' ');
          let wordChunk = '';
          
          for (const word of words) {
            const testWordChunk = wordChunk + (wordChunk ? ' ' : '') + word;
            if (estimateTokens(testWordChunk) <= maxTokens) {
              wordChunk = testWordChunk;
            } else {
              if (wordChunk) chunks.push(wordChunk.trim());
              wordChunk = word;
            }
          }
          if (wordChunk) currentChunk = wordChunk;
        } else {
          currentChunk = testChunk;
        }
      }
    }
  }
  
  // Add final chunk if it exists
  if (currentChunk && estimateTokens(currentChunk) >= minTokens) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

module.exports = {
  stripHtml,
  formatDate,
  sanitizeFilename,
  estimateTokens,
  chunkText
};