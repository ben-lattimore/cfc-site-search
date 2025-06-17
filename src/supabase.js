const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to generate embeddings using OpenAI
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to parse frontmatter from markdown
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    throw new Error('Invalid frontmatter format');
  }
  
  const [, frontmatter, body] = match;
  const metadata = {};
  
  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(': ');
    if (key && valueParts.length > 0) {
      let value = valueParts.join(': ').trim();
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      // Convert numbers
      if (!isNaN(value) && value !== '') {
        value = parseInt(value);
      }
      metadata[key] = value;
    }
  });
  
  return { metadata, content: body.trim() };
}

// Function to upload a single chunk
async function uploadChunk(chunkFile) {
  try {
    const content = await fs.readFile(chunkFile, 'utf8');
    const { metadata, content: chunkContent } = parseFrontmatter(content);
    
    // Generate embedding for the content
    const embedding = await generateEmbedding(chunkContent);
    
    // Prepare data for insertion
    const documentData = {
      source_id: metadata.source_id,
      source_title: metadata.source_title,
      source_slug: metadata.source_slug,
      source_date: metadata.source_date,
      source_modified: metadata.source_modified,
      source_link: metadata.source_link,
      chunk_index: metadata.chunk_index,
      total_chunks: metadata.total_chunks,
      estimated_tokens: metadata.estimated_tokens,
      chunk_type: metadata.chunk_type,
      content: chunkContent,
      embedding
    };
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('documents')
      .insert([documentData])
      .select();
    
    if (error) {
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error(`❌ Error uploading ${chunkFile}:`, error.message);
    throw error;
  }
}

// Function to upload all chunks
async function uploadAllChunks(chunksDir = './output/chunks') {
  try {
    const files = await fs.readdir(chunksDir);
    const chunkFiles = files.filter(file => file.endsWith('.md'));
    
    console.log(`📤 Uploading ${chunkFiles.length} chunks to Supabase...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of chunkFiles) {
      try {
        const filePath = path.join(chunksDir, file);
        await uploadChunk(filePath);
        successCount++;
        console.log(`✅ Uploaded: ${file}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed: ${file}`);
      }
    }
    
    console.log(`🎉 Upload complete: ${successCount} successful, ${errorCount} failed`);
    return { successCount, errorCount, total: chunkFiles.length };
  } catch (error) {
    console.error('❌ Error uploading chunks:', error.message);
    throw error;
  }
}

// Function to search documents
async function searchDocuments(query, options = {}) {
  const {
    matchThreshold = 0.8,
    matchCount = 10
  } = options;
  
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search using the database function
    const { data, error } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount
      });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error searching documents:', error.message);
    throw error;
  }
}

// Function to clear all documents from the database
async function clearAllDocuments() {
  try {
    console.log('🗑️  Clearing all documents from database...');
    
    const { error } = await supabase
      .from('documents')
      .delete()
      .neq('id', 0); // This will delete all rows
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Database cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    throw error;
  }
}

module.exports = {
  supabase,
  uploadChunk,
  uploadAllChunks,
  searchDocuments,
  generateEmbedding,
  clearAllDocuments
};