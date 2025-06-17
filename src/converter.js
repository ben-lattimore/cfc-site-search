const { stripHtml, formatDate, chunkText, estimateTokens } = require('./utils');
const fs = require('fs-extra');
const path = require('path');

function convertToMarkdownChunks(post, outputDir) {
  const title = post.title?.rendered || 'Untitled';
  const content = post.content?.rendered || '';
  const excerpt = post.excerpt?.rendered || '';
  const date = formatDate(post.date);
  const modified = formatDate(post.modified);
  const link = post.link || '';
  
  // Clean content
  const cleanContent = stripHtml(content)
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
  
  const cleanExcerpt = stripHtml(excerpt).trim();
  
  // Combine title, excerpt, and content for chunking
  const fullText = `${title}\n\n${cleanExcerpt ? cleanExcerpt + '\n\n' : ''}${cleanContent}`;
  
  // Create chunks
  const chunks = chunkText(fullText, 100, 400);
  
  // Generate chunk files
  const chunkFiles = [];
  
  chunks.forEach((chunk, index) => {
    const chunkMetadata = {
      source_id: post.id,
      source_title: title,
      source_slug: post.slug || '',
      source_date: date,
      source_modified: modified,
      source_link: link,
      chunk_index: index,
      total_chunks: chunks.length,
      estimated_tokens: estimateTokens(chunk),
      chunk_type: index === 0 ? 'title_excerpt' : 'content'
    };
    
    const markdown = `---
${Object.entries(chunkMetadata)
  .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value.replace(/"/g, '\\"')}"` : value}`)
  .join('\n')}
---

${chunk}

---

**Source:** [${title}](${link})  
**Chunk:** ${index + 1} of ${chunks.length}  
**Tokens:** ~${estimateTokens(chunk)}
`;
    
    const filename = `${post.slug || post.id}_chunk_${String(index + 1).padStart(3, '0')}.md`;
    chunkFiles.push({ filename, content: markdown });
  });
  
  return chunkFiles;
}

module.exports = {
  convertToMarkdownChunks
};